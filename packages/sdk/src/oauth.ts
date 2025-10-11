export type FormField =
  | {
      type: 'text' | 'password';
      label: string;
      key: string;
      isRequired?: boolean;
      placeholder?: string;
    }
  | {
      type: 'select';
      label: string;
      key: string;
      isRequired?: boolean;
      options: {
        label: string;
        value: string;
      }[];
    };

export type Form = {
  fields: FormField[];
};

export let setOauthHandler = (c: {
  getAuthForm?: () => Promise<Form> | Form;
  getAuthorizationUrl: (d: {
    fields: Record<string, string>;
    clientId: string;
    clientSecret: string;
    state: string;
    redirectUri: string;
  }) => Promise<
    | string
    | {
        authorizationUrl: string;
        supportsPKCE?: boolean;
      }
  >;
  handleCallback: (d: {
    fields: Record<string, string>;
    clientId: string;
    clientSecret: string;
    code: string;
    state: string;
    redirectUri: string;
    fullUrl: string;
    codeVerifier?: string;
  }) => Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
    [key: string]: any;
  }>;
  refreshAccessToken?: (data: {
    refreshToken: string;
    clientId: string;
    clientSecret: string;
  }) => Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
    [key: string]: any;
  }>;
}) => {
  if (c.getAuthorizationUrl === undefined) {
    throw new Error('getAuthorizationUrl is required');
  }
  if (c.handleCallback === undefined) {
    throw new Error('handleCallback is required');
  }

  // @ts-ignore
  globalThis.__metorial_setMcpAuth__({
    getAuthForm: c.getAuthForm,
    getAuthorizationUrl: c.getAuthorizationUrl,
    handleCallback: c.handleCallback,
    refreshAccessToken: c.refreshAccessToken
  });
};
