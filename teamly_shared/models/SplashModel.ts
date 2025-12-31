// Model for Splash Screen data
export interface SplashModel {
  appName: string;
  logoSize: number;
  animationDuration: number;
}

export const splashData: SplashModel = {
  appName: 'Teamly',
  logoSize: 120,
  animationDuration: 1000,
};
