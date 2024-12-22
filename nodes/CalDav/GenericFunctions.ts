import {
    IExecuteFunctions,
    ILoadOptionsFunctions
} from 'n8n-core';
import {
    DAVCalendar,
    DAVClient,
} from 'tsdav';
import {
    parseICS,
} from 'node-ical';

/**
 * Fetches the list of calendars available for the authenticated user.
 * @param client - Optional pre-initialized DAVClient instance to use.
 * @returns Array of DAVCalendar objects.
 */
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

/**
 * Fetches events from a specified calendar within a given date range.
 * @param calendarName - Name of the calendar to fetch events from.
 * @param start - Start date for the event search in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ).
 * @param end - End date for the event search in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ).
 * @returns Array of event details.
 */
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

/**
 * Creates a new event in the specified calendar.
 * @param calendarName - Name of the calendar to create the event in.
 * @param eventDetails - Details of the event to be created (summary, description, location, startDate, endDate).
 */
export async function createEvent(
    this: IExecuteFunctions,
    calendarName: string,
    eventDetails: { summary: string; description?: string; location?: string; startDate: Date; endDate: Date },
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
    const icsData = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Example Corp.//CalDAV Client//EN',
        `BEGIN:VEVENT`,
        `UID:${uid}`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:.]/g, '').replace('Z', '')}Z`,
        `DTSTART:${eventDetails.startDate.toISOString().replace(/[-:.]/g, '').replace('Z', '')}Z`,
        `DTEND:${eventDetails.endDate.toISOString().replace(/[-:.]/g, '').replace('Z', '')}Z`,
        `SUMMARY:${eventDetails.summary}`,
        ...(eventDetails.description ? [`DESCRIPTION:${eventDetails.description}`] : []),
        ...(eventDetails.location ? [`LOCATION:${eventDetails.location}`] : []),
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');

    // Create the event
    await client.createCalendarObject({
        calendar,
        filename: `${uid}.ics`,
        data: icsData
    });
}
