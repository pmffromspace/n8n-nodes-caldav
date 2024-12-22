import {
    IExecuteFunctions,
} from 'n8n-core';
import {
    ILoadOptionsFunctions
} from 'n8n-workflow';
import {
    DAVCalendar,
    DAVClient,
} from 'tsdav';
import {
    parseICS,
} from 'node-ical';

export async function getCalendars(
    this: ILoadOptionsFunctions | IExecuteFunctions,
    client?: DAVClient,
) {
    const credentials = await this.getCredentials('calDavBasicAuth');
    if (!client) {
        client = new DAVClient({
            serverUrl: credentials.serverUrl as string,
            credentials: {
                username: credentials.username as string,
                password: credentials.password as string,
            },
            authMethod: 'Basic',
            defaultAccountType: 'caldav',
        });
        await client.login();
    }
    const calendars = await client.fetchCalendars();
    return calendars;
}

export async function getEvents(
    this: IExecuteFunctions,
    calendarName: string,
    start: string,
    end: string,
) {
    const credentials = await this.getCredentials('calDavBasicAuth');
    const client = new DAVClient({
        serverUrl: credentials.serverUrl as string,
        credentials: {
            username: credentials.username as string,
            password: credentials.password as string,
        },
        authMethod: 'Basic',
        defaultAccountType: 'caldav',
    });
    await client.login();
    const calendars = await getCalendars.call(this, client);
    const calendar = calendars.find((calendar) => calendar.displayName === calendarName);
    if (!calendar) {
        throw new Error(`Calendar with name "${calendarName}" not found.`);
    }
    const events = await client.fetchCalendarObjects({
        calendar: calendar as DAVCalendar,
        timeRange: {
            start: start,
            end: end,
        },
        expand: true
    });
    const eventResults = [];
    for (const event of events) {
        const eventData = parseICS(event.data);
        for (const key in eventData) {
            if (key != 'vcalendar') {
                const data = eventData[key] as any;
                eventResults.push({
                    url: event.url,
                    etag: event.etag,
                    ...data
                });
            }
        }
    }
    return eventResults.sort((a, b) => {
        if (a?.start < b?.start) {
            return -1;
        } else if (a?.start > b?.start) {
            return 1;
        } else {
            return 0;
        }
    });
}

export async function createEvent(
    this: IExecuteFunctions,
    calendarName: string,
    eventDetails: { summary: string, description?: string; location?: string; startDate: Date; endDate: Date },
) {
    const credentials = await this.getCredentials('calDavBasicAuth');
    const client = new DAVClient({
        serverUrl: credentials.serverUrl as string,
        credentials: {
            username: credentials.username as string,
            password: credentials.password as string,
        },
        authMethod: 'Basic',
        defaultAccountType: 'caldav',
    });
    await client.login();
    const calendars = await getCalendars.call(this, client);
    const calendar = calendars.find((calendar) => calendar.displayName === calendarName);
    if (!calendar) {
        throw new Error(`Calendar with name "${calendarName}" not found.`);
    }

    // Generate a unique identifier for the event
    const uid = `unique-identifier-${Math.random().toString(36).substring(2, 15)}@example.com`;

    // Construct ICS data
    const icsData = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Example Corp//NONSGML Example Product//EN
BEGIN:VEVENT
UID:${uid}
DTSTAMP;VALUE=DATE-TIME:${new Date().toISOString().replace(/[-:]/g, '').substring(0, 15)}Z
DTSTART;VALUE=DATE-TIME:${eventDetails.startDate.toISOString().replace(/[-:]/g, '').substring(0, 15)}Z
DTEND;VALUE=DATE-TIME:${eventDetails.endDate.toISOString().replace(/[-:]/g, '').substring(0, 15)}Z
SUMMARY:${eventDetails.summary}
DESCRIPTION:${eventDetails.description || ''}
LOCATION:${eventDetails.location || ''}
END:VEVENT
END:VCALENDAR`;

    // Upload ICS data to the calendar
    await client.createCalendarObject({
        calendar: calendar as DAVCalendar,
        iCalString: icsData,
        filename: `${uid}.ics`,
    });
}
