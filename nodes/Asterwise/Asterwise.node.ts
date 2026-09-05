import {
	NodeConnectionTypes,
	type IDataObject,
	type IHttpRequestMethods,
	type INodeProperties,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';

const AYANAMSA_OPTIONS = [
	{ name: 'Lahiri (Default)', value: 'lahiri' },
	{ name: 'Raman', value: 'raman' },
	{ name: 'KP', value: 'kp' },
	{ name: 'Tropical', value: 'tropical' },
];

/** Birth fields sent as top-level body properties (natal, western natal, panchanga). */
function birthFields(ops: string[], namePrefix: string, bodyPrefix = ''): INodeProperties[] {
	const show = { operation: ops };
	const prop = (name: string) => (bodyPrefix ? `${bodyPrefix}.${name}` : name);
	const pname = (name: string) => `${namePrefix}${name.charAt(0).toUpperCase()}${name.slice(1)}`;
	return [
		{
			displayName: 'Date',
			name: pname('date'),
			type: 'string',
			default: '',
			required: true,
			placeholder: '1985-11-12',
			description: 'Date, YYYY-MM-DD',
			displayOptions: { show },
			routing: { send: { type: 'body', property: prop('date') } },
		},
		{
			displayName: 'Time',
			name: pname('time'),
			type: 'string',
			default: '',
			placeholder: '06:45',
			description: 'Time, HH:MM 24-hour. Leave empty if unknown; a sunrise chart is used.',
			displayOptions: { show },
			routing: { send: { type: 'body', property: prop('time'), value: '={{ $value || undefined }}' } },
		},
		{
			displayName: 'Location',
			name: pname('location'),
			type: 'string',
			default: '',
			required: true,
			placeholder: 'Mumbai, India',
			description: 'Place name; the API geocodes it and resolves the time zone',
			displayOptions: { show },
			routing: { send: { type: 'body', property: prop('location') } },
		},
		{
			displayName: 'Name',
			name: pname('name'),
			type: 'string',
			default: '',
			description: 'Optional person name',
			displayOptions: { show },
			routing: { send: { type: 'body', property: prop('name'), value: '={{ $value || undefined }}' } },
		},
	];
}

export class Asterwise implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Asterwise',
		name: 'asterwise',
		icon: { light: 'file:../../icons/asterwise.svg', dark: 'file:../../icons/asterwise.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{ $parameter["operation"] + ": " + $parameter["resource"] }}',
		description:
			'Vedic and Western astrology from the Asterwise API: natal charts, kundali matching with Rajju and Vedha vetoes, panchanga, numerology, or any endpoint',
		defaults: { name: 'Asterwise' },
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'asterwiseApi', required: true }],
		requestDefaults: {
			baseURL: 'https://api.asterwise.com',
			headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Vedic Astrology', value: 'vedic' },
					{ name: 'Western Astrology', value: 'western' },
					{ name: 'Numerology', value: 'numerology' },
					{ name: 'Custom', value: 'custom' },
				],
				default: 'vedic',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['vedic'] } },
				options: [
					{
						name: 'Natal Chart',
						value: 'natalChart',
						action: 'Cast a natal chart',
						description: 'Sidereal planets, houses, ascendant, nakshatras and interpretation',
						routing: { request: { method: 'POST', url: '/v1/astro/natal' } },
					},
					{
						name: 'Matchmaking (Kundali Milan)',
						value: 'matchmaking',
						action: 'Match two people',
						description: 'Ashtakoot score out of 36 with Rajju and Vedha as separate vetoes',
						routing: { request: { method: 'POST', url: '/v1/astro/matchmaking' } },
					},
					{
						name: 'Panchanga',
						value: 'panchanga',
						action: 'Get the daily panchanga',
						description: 'Tithi, nakshatra, yoga, karana, vara, sunrise and sunset for a date and place',
						routing: { request: { method: 'POST', url: '/v1/astro/panchanga' } },
					},
				],
				default: 'natalChart',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['western'] } },
				options: [
					{
						name: 'Natal Chart',
						value: 'westernNatalChart',
						action: 'Cast a natal chart',
						description: 'Tropical planets with Placidus (or chosen) houses, ascendant and midheaven',
						routing: { request: { method: 'POST', url: '/v1/western/natal' } },
					},
				],
				default: 'westernNatalChart',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['numerology'] } },
				options: [
					{
						name: 'Profile',
						value: 'numerologyProfile',
						action: 'Get a numerology profile',
						description: 'Life path, expression, soul urge, personality and related numbers',
						routing: { request: { method: 'POST', url: '/v1/numerology/profile' } },
					},
				],
				default: 'numerologyProfile',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['custom'] } },
				options: [
					{
						name: 'Raw Request',
						value: 'raw',
						action: 'Call any endpoint',
						description: 'Any of the 118 endpoints; see https://docs.asterwise.com',
						routing: {
							request: {
								method: '={{ $parameter["method"] }}' as unknown as IHttpRequestMethods,
								url: '={{ $parameter["path"] }}',
								body: '={{ $parameter["method"] === "GET" ? undefined : JSON.parse($parameter["body"] || "{}") }}' as unknown as IDataObject,
								qs: '={{ $parameter["method"] === "GET" ? JSON.parse($parameter["body"] || "{}") : undefined }}' as unknown as IDataObject,
							},
						},
					},
				],
				default: 'raw',
			},
			// ---- natal (Vedic) ----
			...birthFields(['natalChart'], 'v'),
			{
				displayName: 'Ayanamsa',
				name: 'ayanamsa',
				type: 'options',
				options: AYANAMSA_OPTIONS,
				default: 'lahiri',
				displayOptions: { show: { operation: ['natalChart', 'panchanga'] } },
				routing: { send: { type: 'body', property: 'ayanamsa' } },
			},
			{
				displayName: 'Include Interpretation',
				name: 'includeInterpretation',
				type: 'boolean',
				default: false,
				description: 'Whether to include written interpretation alongside the chart data',
				displayOptions: { show: { operation: ['natalChart'] } },
				routing: { send: { type: 'body', property: 'include_interpretation' } },
			},

			// ---- natal (Western) ----
			...birthFields(['westernNatalChart'], 'w'),
			{
				displayName: 'House System',
				name: 'houseSystem',
				type: 'options',
				options: [
					{ name: 'Placidus (Default)', value: 'placidus' },
					{ name: 'Koch', value: 'koch' },
					{ name: 'Equal', value: 'equal' },
					{ name: 'Whole Sign', value: 'whole_sign' },
				],
				default: 'placidus',
				displayOptions: { show: { operation: ['westernNatalChart'] } },
				routing: { send: { type: 'body', property: 'house_system' } },
			},

			// ---- matchmaking ----
			{
				displayName: 'Person 1 (Groom in the Classical Method)',
				name: 'person1Notice',
				type: 'notice',
				default: '',
				displayOptions: { show: { operation: ['matchmaking'] } },
			},
			...birthFields(['matchmaking'], 'p1', 'person1'),
			{
				displayName: 'Person 2 (Bride in the Classical Method)',
				name: 'person2Notice',
				type: 'notice',
				default: '',
				displayOptions: { show: { operation: ['matchmaking'] } },
			},
			...birthFields(['matchmaking'], 'p2', 'person2'),

			// ---- panchanga ----
			{
				displayName: 'Date',
				name: 'pDate',
				type: 'string',
				default: '',
				required: true,
				placeholder: '2026-09-05',
				description: 'Civil date, YYYY-MM-DD',
				displayOptions: { show: { operation: ['panchanga'] } },
				routing: { send: { type: 'body', property: 'date' } },
			},
			{
				displayName: 'Location',
				name: 'pLocation',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'New Delhi, India',
				description: 'Place name; sunrise and the day’s elements depend on it',
				displayOptions: { show: { operation: ['panchanga'] } },
				routing: { send: { type: 'body', property: 'location' } },
			},

			// ---- numerology ----
			{
				displayName: 'Full Name',
				name: 'fullName',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { operation: ['numerologyProfile'] } },
				routing: { send: { type: 'body', property: 'name' } },
			},
			{
				displayName: 'Date of Birth',
				name: 'nDate',
				type: 'string',
				default: '',
				required: true,
				placeholder: '1990-05-14',
				description: 'Date, YYYY-MM-DD',
				displayOptions: { show: { operation: ['numerologyProfile'] } },
				routing: { send: { type: 'body', property: 'date' } },
			},

			// ---- raw ----
			{
				displayName: 'Method',
				name: 'method',
				type: 'options',
				options: [
					{ name: 'POST', value: 'POST' },
					{ name: 'GET', value: 'GET' },
				],
				default: 'POST',
				displayOptions: { show: { operation: ['raw'] } },
			},
			{
				displayName: 'Path',
				name: 'path',
				type: 'string',
				default: '/v1/astro/dasha',
				required: true,
				description: 'Endpoint path, e.g. /v1/astro/dasha. Full list at https://docs.asterwise.com.',
				displayOptions: { show: { operation: ['raw'] } },
			},
			{
				displayName: 'Body (JSON)',
				name: 'body',
				type: 'json',
				default: '{\n  "date": "1985-11-12",\n  "time": "06:45",\n  "location": "Mumbai, India"\n}',
				description: 'Request body for POST, or query parameters for GET',
				displayOptions: { show: { operation: ['raw'] } },
			},
		],
	};
}
