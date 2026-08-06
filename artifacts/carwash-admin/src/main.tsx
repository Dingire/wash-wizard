import { createRoot } from 'react-dom/client';
import { setBaseUrl } from '@workspace/api-client-react';

import App from './App';

import './index.css';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://localhost:5000' : null);
if (apiBaseUrl) {
	setBaseUrl(apiBaseUrl);
}

createRoot(document.getElementById('root')!).render(<App />);
