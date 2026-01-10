import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  // get the token
  const token = localStorage.getItem('token');

  // add token
  if (token) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `${token}`
      }
    });
    return next(clonedReq);
  }
  return next(req);
};
