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
  const vars = {}

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
    vars.authToken = response.json().token
    sleep(0.9)

    response = http.get('https://pizza-service.joshuajob-cs.click/api/order/menu', {
      headers: {
        accept: '*/*',
        'accept-encoding': 'gzip, deflate, br, zstd',
        authorization:
          `Bearer ${vars.authToken}`,
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
            `Bearer ${vars.authToken}`,
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
          `Bearer ${vars.authToken}`,
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
            `Bearer ${vars.authToken}`,
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
    if (!check(response, { 'purchase status equals 200': (response) => response.status.toString() === '200' })) {
      console.log(response.body);
      fail('Purchase was *not* 200');
    }
    vars.pizzaJwt = response.json().jwt

    response = http.post(
      'https://pizza-factory.cs329.click/api/order/verify',
      JSON.stringify({ jwt: vars.pizzaJwt }),
      {
        headers: {
          accept: '*/*',
          'accept-encoding': 'gzip, deflate, br, zstd',
          authorization:
            `Bearer ${vars.authToken}`,
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
