export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

export const canCreateAssistant = (role: UserRole): boolean => {
    return role === 'TEACHER' || role === 'ADMIN';
};

export const canUploadDocuments = (role: UserRole): boolean => {
    return role === 'TEACHER' || role === 'ADMIN';
};

export const canManageUsers = (role: UserRole): boolean => {
    return role === 'ADMIN';
};

export const canAccessAssistant = (
    userRole: UserRole,
    userId: string,
    assistantCreatorId: string,
    hasExplicitAccess: boolean,
    isPublic: boolean
): boolean => {
    // Admins can access everything
    if (userRole === 'ADMIN') return true;

    // Teachers can access their own assistants
    if (userRole === 'TEACHER' && userId === assistantCreatorId) return true;

    // Students can access public assistants or those explicitly granted
    if (userRole === 'STUDENT' && (isPublic || hasExplicitAccess)) return true;

    return false;
};

export const canViewAnalytics = (role: UserRole): boolean => {
    return role === 'TEACHER' || role === 'ADMIN';
};

export const canEditAssistant = (
    userRole: UserRole,
    userId: string,
    assistantCreatorId: string
): boolean => {
    if (userRole === 'ADMIN') return true;
    return userRole === 'TEACHER' && userId === assistantCreatorId;
};
