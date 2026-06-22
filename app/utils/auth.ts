// utils/auth.ts
import Cookies from 'js-cookie';

export const setAuthKey = (key: string) => {
  Cookies.set('bellator-access', key, { expires: 7, sameSite: 'strict' });
};

export const getAuthKey = () => Cookies.get('bellator-access');