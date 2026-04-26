import ReactDOM from 'react-dom/client';
import './styles.css';
import App from './App';
import { PRISM_STORAGE_KEY_LIST } from '../shared/prismKeys';
import { initStorageBridge } from '../shared/storageBridge';

void initStorageBridge(PRISM_STORAGE_KEY_LIST).finally(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
});
