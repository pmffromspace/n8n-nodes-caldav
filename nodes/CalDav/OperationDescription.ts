/* eslint-disable n8n-nodes-base/node-param-description-wrong-for-dynamic-options */
/* eslint-disable n8n-nodes-base/node-param-display-name-wrong-for-dynamic-options */

import {
	INodeProperties
} from 'n8n-workflow';

export const operationFields = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        displayOptions: {
            show: {
                resource: ['calendar'],
            },
        },
        options: [
            {
                name: 'Get Many',
                value: 'getMany',
                description: 'Retrieve multiple calendars',
            },
        ],
        default: 'getMany',
    },
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        displayOptions: {
            show: {
                resource: ['event'],
            },
        },
        options: [
            {
                name: 'Get Many',
                value: 'getMany',
                description: 'Retrieve multiple events from a calendar',
            },
            {
                name: 'Create',
                value: 'create',
                description: 'Create a new event in a calendar',
            },
        ],
        default: 'getMany',
    },
    {
        displayName: 'Calendar',
        name: 'calendar',
        type: 'options',
        displayOptions: {
            show: {
                resource: ['event'],
                operation: ['getMany', 'create'],
            },
        },
        typeOptions: {
            loadOptionsMethod: 'getCalendars',
        },
        default: '',
    },
    {
        displayName: 'Start Date',
        name: 'start',
        type: 'dateTime',
        displayOptions: {
            show: {
                resource: ['event'],
                operation: ['getMany'],
            },
        },
        required: true,
        default: '',
    },
    {
        displayName: 'End Date',
        name: 'end',
        type: 'dateTime',
        displayOptions: {
            show: {
                resource: ['event'],
                operation: ['getMany'],
            },
        },
        required: true,
        default: '',
    },
    {
        displayName: 'Summary',
        name: 'summary',
        type: 'string',
        displayOptions: {
            show: {
                resource: ['event'],
                operation: ['create'],
            },
        },
        required: true,
        default: '',
    },
    {
        displayName: 'Description',
        name: 'description',
        type: 'string',
        displayOptions: {
            show: {
                resource: ['event'],
                operation: ['create'],
            },
        },
        required: false,
        default: '',
    },
    {
        displayName: 'Location',
        name: 'location',
        type: 'string',
        displayOptions: {
            show: {
                resource: ['event'],
                operation: ['create'],
            },
        },
        required: false,
        default: '',
    },
];
