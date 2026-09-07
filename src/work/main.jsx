import React from 'react'
import ReactDOM from 'react-dom/client'
import WorkApp from './WorkApp.jsx'
import '../index.css'
import '../registerServiceWorker.js'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WorkApp />
  </React.StrictMode>,
)
