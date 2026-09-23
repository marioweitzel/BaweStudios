import fs from 'fs';
import path from 'path';
import { DELIVERY_WARNING } from '../config/env';
import type { DeliveryInfo, DeliveryPackage, StoredProject } from '../types/domain';
import {
  normalizeRelativePathForCompare,
  parseKeyValueFile,
  publicProjectDownloadUrl,
  safeProjectRelativePath
} from '../utils/projectFiles';

type HostTurnEvent = {
  projectId?: string | null;
  userId?: string | null;
  sessionId?: string | null;
  eventType: string;
  payload?: any;
};

export function readDeliveryInfo(project: StoredProject): DeliveryInfo | null {
  const packagePath = safeProjectRelativePath(project, path.join('.bawe', 'delivery-package.json'), 'delivery package');
  if (!fs.existsSync(packagePath)) return null;

  let deliveryPackage: DeliveryPackage;
  try {
    deliveryPackage = JSON.parse(fs.readFileSync(packagePath, 'utf8').replace(/^\uFEFF/, '')) as DeliveryPackage;
  } catch {
    throw new Error('delivery-package.json invalido');
  }

  if (deliveryPackage.status !== 'READY') throw new Error('delivery-package.json no esta READY');
  if (deliveryPackage.zip_encrypted !== true) throw new Error('ZIP de entrega no marcado como cifrado');
  if (!deliveryPackage.zip_path) throw new Error('zip_path faltante en delivery-package.json');
  if (!deliveryPackage.password_file) throw new Error('password_file faltante en delivery-package.json');
  if (deliveryPackage.encryption?.enabled !== true) throw new Error('cifrado no habilitado en delivery-package.json');
  if (deliveryPackage.encryption?.password_delivery !== 'bawe_studios_external') {
    throw new Error('password_delivery invalido en delivery-package.json');
  }

  const zipPath = safeProjectRelativePath(project, deliveryPackage.zip_path, 'zip_path');
  const passwordFilePath = safeProjectRelativePath(project, deliveryPackage.password_file, 'password_file');
  if (!fs.existsSync(zipPath)) throw new Error('ZIP de entrega inexistente');
  if (!fs.existsSync(passwordFilePath)) throw new Error('archivo de password inexistente');

  const passwordData = parseKeyValueFile(passwordFilePath);
  if (!passwordData.ZIP_PASSWORD) throw new Error('ZIP_PASSWORD faltante');
  if (passwordData.ZIP_PATH && normalizeRelativePathForCompare(passwordData.ZIP_PATH) !== normalizeRelativePathForCompare(deliveryPackage.zip_path)) {
    throw new Error('ZIP_PATH del password no coincide con delivery-package.json');
  }
  if (passwordData.PASSWORD_DELIVERY && passwordData.PASSWORD_DELIVERY !== 'bawe_studios_external') {
    throw new Error('PASSWORD_DELIVERY invalido');
  }

  return {
    packagePath,
    zipPath,
    zipPathRelative: normalizeRelativePathForCompare(deliveryPackage.zip_path),
    passwordFilePath,
    zipPassword: passwordData.ZIP_PASSWORD,
    previewUrl: deliveryPackage.preview?.url || '',
    zipEncrypted: true,
    warning: DELIVERY_WARNING
  };
}

export function requireDeliveryInfo(project: StoredProject) {
  const delivery = readDeliveryInfo(project);
  if (!delivery) throw new Error('artefactos de entrega no encontrados');
  return delivery;
}

export function createDeliveryFieldsService(deps: { recordHostTurnEvent: (event: HostTurnEvent) => void }) {
  function deliveryFieldsForProject(project: StoredProject) {
    try {
      const delivery = readDeliveryInfo(project);
      if (!delivery) return {};
      return {
        previewUrl: delivery.previewUrl || project.previewUrl,
        zipUrl: publicProjectDownloadUrl(project.id),
        zipPassword: delivery.zipPassword,
        zipEncrypted: delivery.zipEncrypted,
        deliveryWarning: delivery.warning
      };
    } catch (err) {
      deps.recordHostTurnEvent({
        projectId: project.id,
        userId: project.userId,
        sessionId: null,
        eventType: 'delivery.public_project.validation_failed',
        payload: { error: err instanceof Error ? err.message : String(err) }
      });
      return {};
    }
  }

  return { deliveryFieldsForProject };
}
