const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function formatSlot(isoString, tz) {
  const d = new Date(isoString);
  const local = new Date(d.toLocaleString('en-US', { timeZone: tz }));
  const day = DAYS[local.getDay()];
  const month = MONTHS[local.getMonth()];
  const date = local.getDate();
  let hours = local.getHours();
  const minutes = local.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const minuteStr = minutes === 0 ? '' : `:${String(minutes).padStart(2, '0')}`;
  return `${day} ${month} ${date} at ${hours}${minuteStr} ${ampm}`;
}

export async function handleSlots(url, client, env) {
  const { calEventTypeId, timezone } = client;
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + 90);

  const visitorTz = url.searchParams.get('timeZone') || timezone;
  const startTime = url.searchParams.get('startTime') || now.toISOString();
  const endTime = url.searchParams.get('endTime') || end.toISOString();

  const calUrl = `https://api.cal.com/v2/slots/available?eventTypeId=${calEventTypeId}&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}&timeZone=${encodeURIComponent(visitorTz)}`;

  const res = await fetch(calUrl, {
    headers: {
      Authorization: `Bearer ${env.CAL_API_KEY}`,
      'cal-api-version': '2024-08-13',
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return json({ error: 'Failed to fetch slots', details: err }, 500);
  }

  const data = await res.json();
  const slotsByDay = data?.data?.slots || {};
  const allSlots = [];

  for (const day of Object.keys(slotsByDay).sort()) {
    for (const slot of slotsByDay[day]) {
      const local = new Date(new Date(slot.time).toLocaleString('en-US', { timeZone: visitorTz }));
      const hour = local.getHours();
      if (hour >= 8 && hour < 18) {
        allSlots.push(slot.time);
        break;
      }
    }
    if (allSlots.length >= 20) break;
  }

  const slots = allSlots.map(iso => ({ display: formatSlot(iso, visitorTz), iso }));
  return json({ available_slots: slots });
}

export async function handleBook(request, client, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { visitor_name, visitor_email, start, visitor_timezone } = body;
  if (!visitor_name || !visitor_email || !start) {
    return json({ error: 'Missing required fields: visitor_name, visitor_email, start' }, 400);
  }

  const res = await fetch('https://api.cal.com/v2/bookings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.CAL_API_KEY}`,
      'cal-api-version': '2024-08-13',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      eventTypeId: client.calEventTypeId,
      start,
      attendee: {
        name: visitor_name,
        email: visitor_email,
        timeZone: visitor_timezone || client.timezone,
      },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return json({ error: 'Booking failed', details: data }, 500);
  }

  return json({
    success: true,
    message: `Booking confirmed for ${visitor_name}. A confirmation email will be sent to ${visitor_email}.`,
    uid: data?.data?.uid,
  });
}

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
