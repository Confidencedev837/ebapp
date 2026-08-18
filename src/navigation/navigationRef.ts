// src/navigation/navigationRef.ts
// Global navigation reference — allows navigating from outside of React (e.g., notification listeners)
import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

/**
 * Navigate to a screen from anywhere in the app, even outside React components.
 * Safely handles the case where navigation may not yet be ready.
 */
export const navigateTo = (screen: string, params?: Record<string, any>) => {
    if (navigationRef.isReady()) {
        navigationRef.dispatch(
            CommonActions.navigate({
                name: screen,
                params: params || {},
            })
        );
    } else {
        console.warn('[navigationRef] Navigation not ready yet, cannot navigate to:', screen);
    }
};
