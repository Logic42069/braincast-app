import React, { useState } from 'react';

/*
 * Main React component for the Braincast application. This component
 * controls which screen is visible (landing, loading or report) and
 * orchestrates fetching of data from the API endpoints. To keep the
 * client lightweight and easy to deploy, we avoid external state
 * management libraries and rely on simple hooks.
 */

 type Screen = 'landing' | 'loading' | 'report';

 interface BtcPrice {
   price: number;
   change24h: number;
 }

 interface ReportData {
   direction: 'LONG' | 'SHORT' | 'NONE';
   entryPrice: number;
   targetPrice: number;
   stopPrice: number;
   leverage: number;
 }

 export default function App() {
   const [screen, setScreen] = useState<Screen>('landing');
   const [btcPrice, setBtcPrice] = useState<BtcPrice | null>(null);
   const [report, setReport] = useState<ReportData | null>(null);

   // Handler for kicking off the analysis. This function transitions
   // to the loading screen, fetches price and report data in parallel
   // and ensures a small delay so the loading screen is perceptible.
   const startBraincast = async () => {
     setScreen('loading');
     setBtcPrice(null);
     setReport(null);

     // Start fetching both endpoints concurrently.
     const pricePromise = fetch('/api/btc-price').then((res) => res.json()).catch(() => null);
     const reportPromise = fetch('/api/coinalyze-scalp').then((res) => res.json()).catch(() => null);

     // Wait at least 3.5 seconds to simulate analysis time.
     const delayPromise = new Promise((resolve) => setTimeout(resolve, 3500));

     try {
       const [priceData, reportData] = await Promise.all([pricePromise, reportPromise, delayPromise]);

       // Process BTC price
       if (priceData && typeof priceData.price === 'number') {
         setBtcPrice({
           price: Math.round(priceData.price),
           change24h: typeof priceData.change24h === 'number' ? priceData.change24h : 0,
         });
       } else {
         // Fallback values if API fails
         setBtcPrice({ price: 113279, change24h: -2.76 });
       }

       // Process trade report
       if (reportData && (reportData.signal || reportData.direction)) {
         setReport({
           direction: (reportData.signal || reportData.direction || 'LONG') as ReportData['direction'],
           entryPrice: reportData.entryPrice ?? reportData.technicalData?.entryPrice ?? 119500,
           targetPrice: reportData.targetPrice ?? reportData.exitPrice ?? 121500,
           stopPrice: reportData.stopPrice ?? reportData.stopLoss ?? 119200,
           leverage: reportData.leverage ?? 30,
         });
       } else {
         // Fallback report if API fails
         setReport({
           direction: 'LONG',
           entryPrice: 119500,
           targetPrice: 121500,
           stopPrice: 119200,
           leverage: 30,
         });
       }
     } catch (err) {
       // In case of any error, use fallback data
       setBtcPrice({ price: 113279, change24h: -2.76 });
       setReport({ direction: 'LONG', entryPrice: 119500, targetPrice: 121500, stopPrice: 119200, leverage: 30 });
     }

     // Show the report once the data is ready
     setScreen('report');
   };

   // Reset to landing screen for a new report
   const newReport = () => {
     setScreen('landing');
   };

   // Landing screen markup
   if (screen === 'landing') {
     return (
       <div className="landing-page">
         <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
           What's the weather crypto bro?
         </h1>
         <div style={{ maxWidth: '22rem', marginBottom: '1.5rem' }}>
           {/* Replace src paths with your own assets in /public */}
           <img
             src="/landing.jpeg"
             alt="Landing art"
             style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
           />
         </div>
         <button className="btn" onClick={startBraincast}>
           Start Braincast
         </button>
       </div>
     );
   }

   // Loading screen markup
   if (screen === 'loading') {
     return (
       <div className="loading-container">
         <h1 style={{ fontSize: '2.5rem', fontWeight: 700 }}>BRAINCAST</h1>
         {/* Dot animation: two dots fading in and out. */}
         <div className="dots">
           <div className="dot" style={{ animationDelay: '0s' }}></div>
           <div className="dot" style={{ animationDelay: '0.4s' }}></div>
         </div>
         <div style={{ marginTop: '1.5rem' }}>
           <img src="/loading.jpeg" alt="Loading art" style={{ width: '4rem', height: '4rem', objectFit: 'contain' }} />
         </div>
       </div>
     );
   }

   // Report screen markup
   if (screen === 'report' && btcPrice && report) {
     // Calculate percentage move for the target display
     const targetPercent = Math.abs(report.targetPrice - report.entryPrice) / report.entryPrice * 100;
     const priceChange = btcPrice.change24h;

     return (
       <div className="screen-wrapper">
         <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
           <h1 style={{ fontSize: '2.5rem', fontWeight: 700 }}>BRAINCAST</h1>
         </div>
         <div className="card fade-in">
           {/* Bitcoin price section */}
           <div className="section" style={{ textAlign: 'center', padding: '1rem 0' }}>
             <div className="card-title">Bitcoin Price</div>
             <div className="card-value" style={{ color: '#ea580c' }}>
               ${btcPrice.price.toLocaleString()}
             </div>
             <div
               style={{ fontSize: '1.125rem', fontWeight: 600, marginTop: '0.25rem', color: priceChange >= 0 ? '#16a34a' : '#dc2626' }}
             >
               {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
             </div>
           </div>
           {/* Signal and Target */}
           <div className="grid-2 section">
             <div style={{ textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '0.75rem', padding: '1rem' }}>
               <div className="card-title">Signal</div>
               <div
                 className="card-value"
                 style={{
                   fontSize: '2rem',
                   color:
                     report.direction === 'LONG' ? '#16a34a' : report.direction === 'SHORT' ? '#dc2626' : '#6b7280',
                 }}
               >
                 {report.direction}
               </div>
             </div>
             <div style={{ textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '0.75rem', padding: '1rem' }}>
               <div className="card-title">Target</div>
               <div className="card-value" style={{ fontSize: '2rem', color: '#2563eb' }}>
                 {targetPercent.toFixed(1)}%
               </div>
             </div>
           </div>
           {/* Entry, Target, Stop Loss */}
           <div className="grid-3 section">
             <div style={{ textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '0.75rem', padding: '0.75rem' }}>
               <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>Entry</div>
               <div style={{ fontSize: '1.125rem', fontWeight: 700, marginTop: '0.25rem' }}>
                 ${report.entryPrice.toLocaleString()}
               </div>
             </div>
             <div style={{ textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '0.75rem', padding: '0.75rem' }}>
               <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>Target</div>
               <div style={{ fontSize: '1.125rem', fontWeight: 700, marginTop: '0.25rem', color: '#16a34a' }}>
                 ${report.targetPrice.toLocaleString()}
               </div>
             </div>
             <div style={{ textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '0.75rem', padding: '0.75rem' }}>
               <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>Stop Loss</div>
               <div style={{ fontSize: '1.125rem', fontWeight: 700, marginTop: '0.25rem', color: '#dc2626' }}>
                 ${report.stopPrice.toLocaleString()}
               </div>
             </div>
           </div>
           {/* Leverage section */}
           <div className="section" style={{ textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '0.75rem', padding: '1rem' }}>
             <div className="card-title">Leverage</div>
             <div className="card-value" style={{ fontSize: '2rem', color: '#7e22ce' }}>
               {report.leverage}X
             </div>
           </div>
         </div>
         <div style={{ marginTop: '2rem' }}>
           <button className="btn" onClick={newReport}>
             New Report
           </button>
         </div>
       </div>
     );
   }

   // Fallback if somehow report is undefined
   return null;
 }
