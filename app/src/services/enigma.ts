import Connection from './Connection';
import appStorage from './appStorage';
import * as connectionStorage from './connectionsStorage';

const keys = {
    BASE_URL: 'baseUrl',
    ACCESS_TOKEN: 'access_token'
};

export async function init(baseUrl: string, accessToken: string) {
    await appStorage.clear();
    await appStorage.setItem(keys.BASE_URL, baseUrl);
    await appStorage.setItem(keys.ACCESS_TOKEN, accessToken);
    // await fetchConnections();

    let connections: Connection[] = [
        {
            connectionName: 'defaultConn',
            connectionUrl: 'http://ec2-3-106-116-31.ap-southeast-2.compute.amazonaws.com:8123',
            username: 'default',
            password: 'xaana@2023@@$$',
            version: '',
            type: 'direct',
        }
    ];

    connectionStorage.saveConnections(connections);
    connectionStorage.saveLastActiveConnection(connections[0]);
}

async function fetchConnections() {
    const baseURL = await appStorage.getItem<string>(keys.BASE_URL);
    const accessToken = await appStorage.getItem<string>(keys.ACCESS_TOKEN);

    const headers = new Headers();
    headers.set('Authorization', `Bearer ${accessToken}`);
    headers.set('Content-Type', `application/json`);

    console.log('headers', headers);

    const response = await fetch(`${baseURL}/get_connections`, {
        headers: headers,
        // body: JSON.stringify({}),
    });

    if (response.status === 401 || response.status === 403) {
        throw new Error('Unauthorized access');
    }
    
    if (!response.ok) {
        throw new Error(`Http error: ${response.statusText}`);
    }

    let json = await response.json();
    if (json.error) {
        let message = json.error.data?.message?? (json.error.message?? 'Unknown error');
        
        throw new Error(message);
    }

    let connections = json.data.connections;

    // connectionStorage.saveConnections(connections);
    // if (connections.length > 0) {
    //     connectionStorage.saveLastActiveConnection(connections[0]);
    // }
}