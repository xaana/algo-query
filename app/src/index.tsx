import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { supportsHistory } from 'history/DOMUtils';
import { Provider } from 'mobx-react';
import { initStores } from 'stores';
import { connectionsStorage } from 'services';
import App, { AppProps } from 'views/App';

const appRootElement = document.getElementById('root')!;

function render(
  container: HTMLElement,
  Component: React.ComponentType<AppProps>,
  appProps: AppProps,
  store: ReturnType<typeof initStores>,
  cb?: () => void
) {
  ReactDOM.render(
    <Provider store={store}>
      <BrowserRouter forceRefresh={!supportsHistory()}>
        <Component {...appProps} />
      </BrowserRouter>
    </Provider>,
    container,
    cb
  );
}

(async () => {
  if (
    window.self === window.top // Not inside iframe
    || document.referrer !== 'https://enigmauat.xaana.net/' // Not inside enigm
  ) {
    //Redirect to enigma
    window.location.href = 'https://enigmauat.xaana.net/';
  }

  const enigmaUrl = 'https://enigmauat.xaana.net/restapi/1.0/common/oauth2/access_token';

  let formData = new FormData();
  formData.append('client_id', /* @mangle */ 'ztKOW8yDBHHdOmCGxn8TTf5lslLJFw6u' /* @/mangle */);
  formData.append('client_secret', /* @mangle */ 'w8fja7tZFovPhAbkovu33GoYEIjL0pBr' /* @/mangle */);
  formData.append('grant_type', /* @mangle */ 'refresh_token' /* @/mangle */);
  formData.append('refresh_token', /* @mangle */ 'NdvTKlqJPVNtec2hg8JxMIbHtsFArXHF' /* @/mangle */);

  let resp = await fetch(enigmaUrl, {
    method: 'POST',
    body: formData,
  })

  if (resp.status !== 200) {
    return ReactDOM.render(<div style={{color: '#ffffff'}}>Unauthorized access</div>, appRootElement);
  }

  const rootStore = initStores();
  const connection = await connectionsStorage.getLastActiveConnection();

  render(appRootElement, App, { connection: connection.orUndefined() }, rootStore);

  if (module.hot) {
    module.hot.accept('views/App', () => {
      import('views/App').then(({ default: NextApp }) => {
        render(
          appRootElement,
          NextApp,
          { connection: connection.orUndefined() },
          rootStore,
          rootStore.reinitialize
        );
      });
    });

    module.hot.accept('stores', () => {
      import('stores').then(({ initStores: nextInitStores }) => {
        const nextStore = nextInitStores();
        rootStore.updateChildStores(nextStore, connection.orUndefined());
        render(appRootElement, App, { connection: connection.orUndefined() }, rootStore);
      });
    });

    module.hot.accept((err) => {
      console.error('HMR error:', err);
    });
  }
})();
