export enum PlanType {
  BASICO = "basico",
  MEDIO = "medio",
  AVANZADO = "avanzado",
}

export enum UserRole {
  ADMIN = "admin",
  CAJERO = "cajero",
  MESERO = "mesero",
  COCINA = "cocina",
}

export interface PlanPermissions {
  canManageMesas: boolean;
  canManageDelivery: boolean;
  canUseKDS: boolean;
  canManageCredit: boolean;
  canManagePropinasAvanzado: boolean;
  canMultiPrice: boolean;
  canManageInventario: boolean;
  canManageRecetas: boolean;
  canManageCompras: boolean;
  canManageProveedores: boolean;
}

export const PLAN_PERMISSIONS: Record<PlanType, PlanPermissions> = {
  [PlanType.BASICO]: {
    canManageMesas: false,
    canManageDelivery: false,
    canUseKDS: false,
    canManageCredit: false,
    canManagePropinasAvanzado: false,
    canMultiPrice: false,
    canManageInventario: false,
    canManageRecetas: false,
    canManageCompras: false,
    canManageProveedores: false,
  },
  [PlanType.MEDIO]: {
    canManageMesas: true,
    canManageDelivery: true,
    canUseKDS: true,
    canManageCredit: true,
    canManagePropinasAvanzado: true,
    canMultiPrice: true,
    canManageInventario: false,
    canManageRecetas: false,
    canManageCompras: false,
    canManageProveedores: false,
  },
  [PlanType.AVANZADO]: {
    canManageMesas: true,
    canManageDelivery: true,
    canUseKDS: true,
    canManageCredit: true,
    canManagePropinasAvanzado: true,
    canMultiPrice: true,
    canManageInventario: true,
    canManageRecetas: true,
    canManageCompras: true,
    canManageProveedores: true,
  },
};

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.ADMIN]: 100,
  [UserRole.CAJERO]: 50,
  [UserRole.MESERO]: 30,
  [UserRole.COCINA]: 20,
};
