import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  // get the token
  const token = localStorage.getItem('token');


  const externalApis = [
    'router.project-osrm.org',
    'photon.komoot.io',
  ];


  const isExternal = externalApis.some(domain => req.url.includes(domain));


  if (isExternal) {
    return next(req);
  }

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: token } })
    : req;

  return next(authReq);
};
