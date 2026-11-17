import { sleep, check, group, fail } from 'k6';
import http from 'k6/http'

export const options = {
  cloud: {
    distribution: { 'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 100 } },
    apm: [],
  },
  thresholds: {},
  scenarios: {
    Imported_HAR: {
      executor: 'ramping-vus',
      gracefulStop: '30s',
      stages: [
        { target: 5, duration: '30s' },
        { target: 15, duration: '1m' },
        { target: 10, duration: '30s' },
        { target: 0, duration: '30s' },
      ],
      gracefulRampDown: '30s',
      exec: 'imported_HAR',
    },
  },
}

export function imported_HAR() {
  let response

  group('page@85f99193c37d9983a7d2f488b9660a0b - JWT Pizza', function () {
    response = http.get('https://pizza.joshuajob-cs.click/', {
      headers: {
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-encoding': 'gzip, deflate, br, zstd',
        priority: 'u=0, i',
        'sec-ch-ua': '"HeadlessChrome";v="153", "Not_A Brand";v="8", "Chromium";v="153"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Linux"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
      },
    })
    sleep(0.7)

    response = http.put(
      'https://pizza-service.joshuajob-cs.click/api/auth',
      '{"email":"d@jwt.com","password":"diner"}',
      {
        headers: {
          accept: '*/*',
          'accept-encoding': 'gzip, deflate, br, zstd',
          'content-type': 'application/json',
          origin: 'https://pizza.joshuajob-cs.click',
          priority: 'u=1, i',
          'sec-ch-ua': '"HeadlessChrome";v="153", "Not_A Brand";v="8", "Chromium";v="153"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Linux"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
        },
      }
    )
    if (!check(response, { 'status equals 200': (response) => response.status.toString() === '200' })) {
      console.log(response.body);
      fail('Login was *not* 200');
    }
    sleep(0.9)

    response = http.get('https://pizza-service.joshuajob-cs.click/api/order/menu', {
      headers: {
        accept: '*/*',
        'accept-encoding': 'gzip, deflate, br, zstd',
        authorization:
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwibmFtZSI6InBpenphIGRpbmVyIiwiZW1haWwiOiJkQGp3dC5jb20iLCJyb2xlcyI6W3sicm9sZSI6ImRpbmVyIn1dLCJpYXQiOjE3OTQ4OTI0ODR9.jklTkoOJAjnpK0Wc46xPirU0kpZwOR0U2-zAPEmQ8u0',
        'content-type': 'application/json',
        origin: 'https://pizza.joshuajob-cs.click',
        priority: 'u=1, i',
        'sec-ch-ua': '"HeadlessChrome";v="153", "Not_A Brand";v="8", "Chromium";v="153"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Linux"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
      },
    })

    response = http.get(
      'https://pizza-service.joshuajob-cs.click/api/franchise?page=0&limit=20&name=*',
      {
        headers: {
          accept: '*/*',
          'accept-encoding': 'gzip, deflate, br, zstd',
          authorization:
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwibmFtZSI6InBpenphIGRpbmVyIiwiZW1haWwiOiJkQGp3dC5jb20iLCJyb2xlcyI6W3sicm9sZSI6ImRpbmVyIn1dLCJpYXQiOjE3OTQ4OTI0ODR9.jklTkoOJAjnpK0Wc46xPirU0kpZwOR0U2-zAPEmQ8u0',
          'content-type': 'application/json',
          origin: 'https://pizza.joshuajob-cs.click',
          priority: 'u=1, i',
          'sec-ch-ua': '"HeadlessChrome";v="153", "Not_A Brand";v="8", "Chromium";v="153"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Linux"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
        },
      }
    )
    sleep(1.1)

    response = http.get('https://pizza-service.joshuajob-cs.click/api/user/me', {
      headers: {
        accept: '*/*',
        'accept-encoding': 'gzip, deflate, br, zstd',
        authorization:
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwibmFtZSI6InBpenphIGRpbmVyIiwiZW1haWwiOiJkQGp3dC5jb20iLCJyb2xlcyI6W3sicm9sZSI6ImRpbmVyIn1dLCJpYXQiOjE3OTQ4OTI0ODR9.jklTkoOJAjnpK0Wc46xPirU0kpZwOR0U2-zAPEmQ8u0',
        'content-type': 'application/json',
        origin: 'https://pizza.joshuajob-cs.click',
        priority: 'u=1, i',
        'sec-ch-ua': '"HeadlessChrome";v="153", "Not_A Brand";v="8", "Chromium";v="153"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Linux"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
      },
    })

    response = http.post(
      'https://pizza-service.joshuajob-cs.click/api/order',
      '{"items":[{"menuId":2,"description":"Pepperoni","price":0.0042}],"storeId":"1","franchiseId":1}',
      {
        headers: {
          accept: '*/*',
          'accept-encoding': 'gzip, deflate, br, zstd',
          authorization:
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwibmFtZSI6InBpenphIGRpbmVyIiwiZW1haWwiOiJkQGp3dC5jb20iLCJyb2xlcyI6W3sicm9sZSI6ImRpbmVyIn1dLCJpYXQiOjE3OTQ4OTI0ODR9.jklTkoOJAjnpK0Wc46xPirU0kpZwOR0U2-zAPEmQ8u0',
          'content-type': 'application/json',
          origin: 'https://pizza.joshuajob-cs.click',
          priority: 'u=1, i',
          'sec-ch-ua': '"HeadlessChrome";v="153", "Not_A Brand";v="8", "Chromium";v="153"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Linux"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
        },
      }
    )
    // TODO: check the purchase succeeded, and stop this iteration if it didn't

    response = http.post(
      'https://pizza-factory.cs329.click/api/order/verify',
      '{"jwt":"eyJpYXQiOjE3OTQ4OTI0ODYsImV4cCI6MTc5NDk3ODg4NiwiaXNzIjoiY3MzMjkuY2xpY2siLCJhbGciOiJSUzI1NiIsImtpZCI6Ik9TcF94VzhlM3kwNk1KS3ZIeW9sRFZMaXZXX2hnTWxhcFZSUVFQVndiY0UifQ.eyJ2ZW5kb3IiOnsiaWQiOiJqb3Noam9iIiwibmFtZSI6Ikpvc2h1YSBKb2IifSwiZGluZXIiOnsiaWQiOjIsIm5hbWUiOiJwaXp6YSBkaW5lciIsImVtYWlsIjoiZEBqd3QuY29tIn0sIm9yZGVyIjp7Iml0ZW1zIjpbeyJtZW51SWQiOjIsImRlc2NyaXB0aW9uIjoiUGVwcGVyb25pIiwicHJpY2UiOjAuMDA0Mn1dLCJzdG9yZUlkIjoiMSIsImZyYW5jaGlzZUlkIjoxLCJpZCI6Mjd9fQ.bNQaEPkbpXu2QlzHNYlNE-SUfgiAXK9t6bqh8T91iMtqUtp9rW12-5e-hIVUj41toxci_x5Slb5oz4nYSliZMo2fIlUb3vjmPATpdUFRh7VaDwvX2RtloOMdT_nSWrExGmt6IVQ2npMTQYq9IvtOyNhupSZmEGVz53FXdh6sEiZ4Xozer4H2VKhopbFvl1i0pqHJdKnmvdw3OyWTwpdMiol3_lR2fzWM_fV5pPvdLLUAPV5mJBwzt1tJaPUL-TGUl3KjoF9ta21wyGUkziYaj7lvlLeapELz5X6LkYIJOqFD9W6wXdUz_I-9h-vFa40KNMdqMtPqGDQdDMJb6iVbtH-ym1Gpy0UmtwAwwSSWDwGD1Yyb5VBZhVZMmShgSoV7spi1cIq3fRwvmhyA8MCxwwqaBTG3iFO_tug23HHa99ObRfHNSRe6OPwXmIEKPou32H4yY_KNbx6dOvjCeAwVJbIs7G05KF8MQZ8U0U5pi05AEcbG6vqI3sigR2cJ5hmizfPfvmxWUstqxsQ4Xx9pDX7b0kpsVnR1m0D4UU6yydUBvojMNokY2IjgiYaZ_LFfVtmFjqbGpgwVcmDblLnYYj-7vrkEHz4AUFLCb29hnQqrmB-zk801SOIB2ffR0IxIkkuaPVmGgFzg4viS_twGAVMLWaqHpC0nPZDvCyOdazQ"}',
      {
        headers: {
          accept: '*/*',
          'accept-encoding': 'gzip, deflate, br, zstd',
          authorization:
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwibmFtZSI6InBpenphIGRpbmVyIiwiZW1haWwiOiJkQGp3dC5jb20iLCJyb2xlcyI6W3sicm9sZSI6ImRpbmVyIn1dLCJpYXQiOjE3OTQ4OTI0ODR9.jklTkoOJAjnpK0Wc46xPirU0kpZwOR0U2-zAPEmQ8u0',
          'content-type': 'application/json',
          origin: 'https://pizza.joshuajob-cs.click',
          priority: 'u=1, i',
          'sec-ch-ua': '"HeadlessChrome";v="153", "Not_A Brand";v="8", "Chromium";v="153"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Linux"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'cross-site',
          'sec-fetch-storage-access': 'active',
        },
      }
    )
  })
}
