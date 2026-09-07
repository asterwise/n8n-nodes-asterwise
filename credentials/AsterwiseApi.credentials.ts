import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class AsterwiseApi implements ICredentialType {
	name = 'asterwiseApi';

	displayName = 'Asterwise API';

	icon: Icon = { light: 'file:../icons/asterwise.svg', dark: 'file:../icons/asterwise.dark.svg' };

	documentationUrl = 'https://docs.asterwise.com/quickstart/';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description:
				'Get a free key at https://asterwise.com/dashboard (500 calls a month, no card)',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.asterwise.com',
			url: '/v1/numerology/life-path',
			method: 'GET',
			qs: { date: '2000-01-01' },
		},
	};
}
