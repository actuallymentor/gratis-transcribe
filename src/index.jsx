import '@fontsource-variable/montserrat'
import '@fontsource-variable/nunito'
import './index.css'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { QueryParamProvider } from 'use-query-params'
import { WindowHistoryAdapter } from 'use-query-params/adapters/window'
import { App } from './App.jsx'

createRoot( document.getElementById( `root` ) ).render(
    <React.StrictMode>
        <BrowserRouter>
            <QueryParamProvider adapter={ WindowHistoryAdapter }>
                <App />
            </QueryParamProvider>
        </BrowserRouter>
    </React.StrictMode>
)
