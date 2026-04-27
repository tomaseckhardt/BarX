function toSafeName(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/[<>"']/g, '')
    .trim();
}

function buildEmail(rawEmail, tag, stamp) {
  const base = String(rawEmail || '').toLowerCase().trim();
  const [localPartRaw, domainRaw] = base.split('@');

  const localPart = String(localPartRaw || 'user')
    .replace(/[^a-z0-9._+-]/g, '')
    .slice(0, 24) || 'user';

  const domain = /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(String(domainRaw || ''))
    ? String(domainRaw).toLowerCase()
    : 'barx.cz';

  const safeTag = String(tag || 'e2e').toLowerCase().replace(/[^a-z0-9]/g, '') || 'e2e';
  return safeTag + '.' + localPart + '.' + String(stamp) + '@' + domain;
}

function normalizePhone(rawPhone, stamp) {
  let digits = String(rawPhone || '').replace(/\D/g, '');
  if (digits.length < 9) {
    digits = String(777000000 + (Number(stamp) % 1_000_000));
  }
  digits = digits.slice(-9);
  return '+420 ' + digits.slice(0, 3) + ' ' + digits.slice(3, 6) + ' ' + digits.slice(6);
}

function fallbackUser(stamp) {
  const seed = Number(stamp) || Date.now();
  return {
    name: 'Test User ' + String(seed).slice(-6),
    email: 'fallback.' + seed + '@barx.cz',
    phone: '+420 777 ' + String(seed).slice(-6)
  };
}

async function fetchRandomUser(request) {
  const response = await request.get('https://randomuser.me/api/?inc=name,email,phone,cell&noinfo', {
    timeout: 7000
  });
  if (!response.ok()) {
    throw new Error('RandomUser API returned status ' + response.status());
  }

  const payload = await response.json();
  const first = payload && payload.results && payload.results[0];
  if (!first) {
    throw new Error('RandomUser API returned empty results');
  }

  const firstName = first.name && first.name.first ? String(first.name.first) : 'Random';
  const lastName = first.name && first.name.last ? String(first.name.last) : 'User';

  return {
    name: toSafeName(firstName + ' ' + lastName) || 'Random User',
    email: String(first.email || ''),
    phone: String(first.cell || first.phone || '')
  };
}

async function getTestUser(request, options = {}) {
  const stamp = options.stamp || Date.now();
  const tag = options.tag || 'E2E';
  const useRandomApi = process.env.USE_RANDOMUSER !== '0';

  let base = fallbackUser(stamp);
  if (useRandomApi) {
    try {
      base = await fetchRandomUser(request);
    } catch {
      base = fallbackUser(stamp);
    }
  }

  const suffix = String(stamp).slice(-6);
  return {
    name: toSafeName(tag + ' ' + base.name + ' ' + suffix),
    phone: normalizePhone(base.phone, stamp),
    email: buildEmail(base.email, tag, stamp)
  };
}

module.exports = {
  getTestUser
};
