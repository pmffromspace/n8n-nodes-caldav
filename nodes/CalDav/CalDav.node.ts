import {
    IExecuteFunctions,
} from 'n8n-core';
import {
    ILoadOptionsFunctions,
    INodeExecutionData,
    INodePropertyOptions,
    INodeType,
    INodeTypeDescription,
} from 'n8n-workflow';
import {
    getCalendars,
    getEvents,
    createEvent, // Import the new function
} from './GenericFunctions';
import { operationFields } from './OperationDescription';

export class CalDav implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'CalDAV',
        name: 'calDav',
        icon: 'file:calDav.svg',
        group: ['output'],
        version: 1,
        subtitle: '={{ $parameter["operation"] + ": " + $parameter["resource"] }}',
        description: 'Connect n8n to a CalDAV server',
        defaults: {
            name: 'CalDAV',
        },
        inputs: ['main'],
        outputs: ['main'],
        credentials: [
            {
                name: 'calDavBasicAuth',
                required: true,
            },
        ],
        properties: [
            {
                displayName: 'Resource',
                name: 'resource',
                type: 'options',
                options: [
                    {
                        name: 'Calendar',
                        value: 'calendar',
                    },
                    {
                        name: 'Event',
                        value: 'event',
                    }
                ],
                default: 'calendar',
                noDataExpression: true,
                required: true,
            },
            ...operationFields,
        ]
    };

    methods = {
        loadOptions: {
            async getCalendars(
                this: ILoadOptionsFunctions,
            ): Promise<INodePropertyOptions[]> {
                const calendars = await getCalendars.call(this);
                return calendars.map(calendar => ({
                    name: calendar.name || 'Unknown',
                    value: calendar.id || '',
                }));
            },
        },
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        let responseData;

        const resource = this.getNodeParameter('resource', 0) as string;
        const operation = this.getNodeParameter('operation', 0) as string;

        if (resource === 'calendar') {
            if (operation === 'getMany') {
                responseData = await getCalendars.call(this);
            }
        } else if (resource === 'event') {
            if (operation === 'getMany') {
                const calendarId = this.getNodeParameter('calendar', 0) as string;
                const startDate = this.getNodeParameter('start', 0) as string;
                const endDate = this.getNodeParameter('end', 0) as string;
                responseData = await getEvents.call(this, calendarId, startDate, endDate);
            } else if (operation === 'create') {
                const calendarId = this.getNodeParameter('calendar', 0) as string;
                const summary = this.getNodeParameter('summary', 0) as string;
                const description = this.getNodeParameter('description', 0) as string;
                const location = this.getNodeParameter('location', 0) as string;
                responseData = await createEvent.call(this, calendarId, summary, description, location);
            }
        }

        return [this.helpers.returnJsonArray(responseData)];
    }
}
