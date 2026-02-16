import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// New Components
import Landing from './components/Landing.tsx';
import Features from './components/Features.tsx';
import AboutUs from './components/AboutUs.tsx';
import Services from './components/Services.tsx';
import Contact from './components/Contact.tsx';

// Existing Components
import MapComponent from './components/MapComponent.tsx';
import ChatBot from './components/ChatBot.tsx';
import DutyCalculator from './components/DutyCalculator.tsx';
import BankOffers from './components/BankOffers.tsx';
import Testimonials from './components/Testimonials.tsx';

// Services
import { analyzePropertyMarket, generatePropertyReport } from './services/geminiService.ts';
import { getDistrictsByState, getLandmarksByDistrict, getAllStates, getAccurateCoordinates } from './services/locationService.ts';
import { PredictionResult, LocationOption } from './types.ts';
import PropertyReportComponent from './components/PropertyReport.tsx';
import { formatINR } from './services/utils.ts';

const App: React.FC = () => {
    // State for Form
    const [selectedState, setSelectedState] = useState('');
    const [district, setDistrict] = useState('');
    const [landmark, setLandmark] = useState('');
    const [propertyType, setPropertyType] = useState('Residential Land');
    const [size, setSize] = useState(1000);
    const [targetYear, setTargetYear] = useState(new Date().getFullYear() + 5);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Dynamic Data States
    const [allStates, setAllStates] = useState<LocationOption[]>([]);
    const [districtSuggestions, setDistrictSuggestions] = useState<LocationOption[]>([]);
    const [landmarkSuggestions, setLandmarkSuggestions] = useState<LocationOption[]>([]);

    // Results State
    const [prediction, setPrediction] = useState<PredictionResult | null>(null);

    // Initial load: States
    useEffect(() => {
        const loadInitialData = async () => {
            const states = await getAllStates();
            setAllStates(states);
        };
        loadInitialData();
    }, []);

    // Load Districts when State changes
    useEffect(() => {
        const loadDistricts = async () => {
            if (selectedState) {
                const districts = await getDistrictsByState(selectedState);
                setDistrictSuggestions(districts);
                // Reset district and landmark when state changes
                setDistrict('');
                setLandmark('');
                setLandmarkSuggestions([]);

                // Center map on state
                const stateData = allStates.find(s => s.name === selectedState);
                if (stateData && stateData.lat && stateData.lng) {
                    setPrediction(prev => prev ? { ...prev, location: { lat: stateData.lat!, lng: stateData.lng!, name: selectedState } } : null);
                }
            }
        };
        loadDistricts();
    }, [selectedState]);

    // Load Landmarks when District changes
    useEffect(() => {
        const loadLandmarks = async () => {
            if (district && selectedState) {
                // Find district coordinates to help landmark search
                const distInfo = districtSuggestions.find(d => d.name === district);
                const landmarks = await getLandmarksByDistrict(selectedState, district, distInfo?.lat, distInfo?.lng);
                setLandmarkSuggestions(landmarks);

                // If we have district info, center map on district
                if (distInfo && distInfo.lat && distInfo.lng) {
                    setPrediction(prev => prev ? { ...prev, location: { lat: distInfo.lat!, lng: distInfo.lng!, name: district } } : null);
                }
            }
        };
        loadLandmarks();
    }, [district, selectedState, districtSuggestions]);

    const handlePredict = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedState || !district || !landmark) {
            alert("Please select State, District and Landmark");
            return;
        }

        setIsAnalyzing(true);
        try {
            const analysis = await analyzePropertyMarket(
                selectedState,
                district,
                landmark,
                propertyType,
                size,
                targetYear
            );

            const currentPrice = analysis.currentRatePerSqFt * size;
            const futurePrice = analysis.futureRatePerSqFt * size;

            // Generate detailed property report
            const report = await generatePropertyReport(
                selectedState,
                district,
                landmark,
                currentPrice,
                futurePrice,
                targetYear
            );

            // Find precise location for the map via API
            const accurateLoc = await getAccurateCoordinates(landmark, district, selectedState);

            const locInfo = accurateLoc ||
                landmarkSuggestions.find(l => l.name === landmark) ||
                districtSuggestions.find(d => d.name === district) ||
                allStates.find(s => s.name === selectedState);

            setPrediction({
                currentPrice,
                futurePrice,
                currency: 'INR',
                trendHistory: analysis.trendHistory,
                explanation: analysis.explanation,
                location: {
                    lat: locInfo?.lat || 20.5937,
                    lng: locInfo?.lng || 78.9629,
                    name: landmark
                },
                premiumFactor: 1.2,
                report,
                currentRatePerSqFt: analysis.currentRatePerSqFt,
                futureRatePerSqFt: analysis.futureRatePerSqFt
            });

            // Scroll to results
            setTimeout(() => {
                document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);

        } catch (error) {
            console.error("Prediction error:", error);
            alert("Analysis failed. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="min-h-screen">
            {/* Enhanced Navigation */}
            <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                            <i className="fas fa-home text-white text-lg"></i>
                        </div>
                        <span className="text-2xl font-black gradient-text tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                            Propridict <span className="text-slate-900">AI</span>
                        </span>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#home" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">Home</a>
                        <a href="#predict" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">AI Predictor</a>
                        <a href="#services" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">Services</a>
                        <a href="#offers" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">Bank Offers</a>
                        <a href="#contact" className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95">Support</a>
                    </div>
                </div>
            </nav>

            <Landing />
            <Features />
            <AboutUs />

            {/* AI Market Analysis Section (Prediction Form) */}
            <section id="predict" className="relative py-20 bg-white overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-16">
                        <span className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-bold tracking-wide uppercase mb-4 inline-block">AI Intelligence</span>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
                            Predict Future Property Values
                        </h2>
                        <p className="text-slate-500 max-w-2xl mx-auto text-lg">
                            Enter your location details and our proprietary AI will analyze market trends, infrastructure development, and historical data to provide accurate future valuations.
                        </p>
                    </div>

                    <div className="card shadow-2xl p-8 md:p-12 mb-20 border-t-4 border-indigo-600">
                        <form onSubmit={handlePredict} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* State Selection */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    <i className="fas fa-map-marked-alt text-indigo-600 mr-2"></i>
                                    State
                                </label>
                                <select
                                    value={selectedState}
                                    onChange={e => setSelectedState(e.target.value)}
                                    className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all hover:border-slate-300"
                                >
                                    <option value="">Select State</option>
                                    {allStates.map(s => <option key={s.code || s.name} value={s.name}>{s.name}</option>)}
                                </select>
                            </div>

                            {/* District with Autocomplete */}
                            <div className="relative">
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    <i className="fas fa-city text-indigo-600 mr-2"></i>
                                    District / City
                                </label>
                                <input
                                    type="text"
                                    value={district}
                                    onChange={e => setDistrict(e.target.value)}
                                    placeholder="Type to search..."
                                    className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all hover:border-slate-300"
                                    disabled={!selectedState}
                                />
                                {districtSuggestions.length > 0 && district && !districtSuggestions.find(d => d.name === district) && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                        {districtSuggestions
                                            .filter(d => d.name.toLowerCase().includes(district.toLowerCase()))
                                            .map((d, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    className="w-full text-left p-3 hover:bg-slate-50 border-b border-slate-50 last:border-0"
                                                    onClick={() => setDistrict(d.name)}
                                                >
                                                    {d.name}
                                                </button>
                                            ))}
                                    </div>
                                )}
                            </div>

                            {/* Landmark with Autocomplete */}
                            <div className="relative">
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    <i className="fas fa-location-arrow text-indigo-600 mr-2"></i>
                                    Landmark / Area
                                </label>
                                <input
                                    type="text"
                                    value={landmark}
                                    onChange={e => setLandmark(e.target.value)}
                                    placeholder="Enter nearby location..."
                                    className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all hover:border-slate-300"
                                    disabled={!district}
                                />
                                {landmarkSuggestions.length > 0 && landmark && !landmarkSuggestions.find(l => l.name === landmark) && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                        {landmarkSuggestions
                                            .filter(l => l.name.toLowerCase().includes(landmark.toLowerCase()))
                                            .map((l, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    className="w-full text-left p-3 hover:bg-slate-50 border-b border-slate-50 last:border-0"
                                                    onClick={() => setLandmark(l.name)}
                                                >
                                                    {l.name}
                                                </button>
                                            ))}
                                    </div>
                                )}
                            </div>

                            {/* Property Type */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    <i className="fas fa-home text-indigo-600 mr-2"></i>
                                    Property Type
                                </label>
                                <select
                                    value={propertyType}
                                    onChange={e => setPropertyType(e.target.value)}
                                    className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all hover:border-slate-300"
                                >
                                    <option>Residential Land</option>
                                    <option>Agricultural Land</option>
                                    <option>Commercial Land</option>
                                    <option>Industrial Land</option>
                                    <option>Apartment</option>
                                </select>
                            </div>

                            {/* Size */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    <i className="fas fa-ruler-combined text-indigo-600 mr-2"></i>
                                    Size (sq. ft)
                                </label>
                                <input
                                    type="number"
                                    value={size}
                                    onChange={e => setSize(Number(e.target.value))}
                                    className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all hover:border-slate-300"
                                />
                            </div>

                            {/* Target Year */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    <i className="fas fa-calendar-alt text-indigo-600 mr-2"></i>
                                    Projection Year
                                </label>
                                <input
                                    type="number"
                                    value={targetYear}
                                    onChange={e => setTargetYear(Number(e.target.value))}
                                    min={new Date().getFullYear() + 1}
                                    max={new Date().getFullYear() + 30}
                                    className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all hover:border-slate-300"
                                />
                            </div>

                            <div className="lg:col-span-3 mt-4">
                                <button
                                    type="submit"
                                    disabled={isAnalyzing}
                                    className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-xl transition-all flex items-center justify-center gap-3 ${isAnalyzing ? 'bg-slate-400' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-indigo-500/40 hover:-translate-y-1'}`}
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin"></i>
                                            Analyzing Market with Gemini AI...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-brain"></i>
                                            Generate AI Valuation Report
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Results Section */}
                    {prediction && (
                        <div id="results" className="animate-fade-in-up">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                                {/* Valuation Card */}
                                <div className="card bg-slate-900 text-white overflow-hidden relative">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-20 -mr-32 -mt-32"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-8">
                                            <div className="p-3 bg-white/10 rounded-xl backdrop-blur">
                                                <i className="fas fa-chart-line text-indigo-400 text-xl"></i>
                                            </div>
                                            <h3 className="text-2xl font-bold">Valuation Summary</h3>
                                        </div>

                                        <div className="space-y-8">
                                            <div>
                                                <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Estimated Value in {targetYear}</div>
                                                <div className="text-5xl md:text-6xl font-black gradient-text">
                                                    {formatINR(prediction.futurePrice)}
                                                </div>
                                                <div className="text-slate-400 mt-2 text-sm">
                                                    Current: <span className="font-bold text-slate-800">{formatINR(prediction.currentPrice)}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-6 p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur">
                                                <div>
                                                    <div className="text-xs font-bold text-slate-500 uppercase mb-1">Total Appreciation</div>
                                                    <div className="text-2xl font-bold text-green-400">
                                                        +{Math.round(((prediction.futurePrice - prediction.currentPrice) / prediction.currentPrice) * 100)}%
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-slate-500 uppercase mb-1">Annual Growth</div>
                                                    <div className="text-2xl font-bold text-indigo-400">
                                                        ~{((Math.pow(prediction.futurePrice / prediction.currentPrice, 1 / (targetYear - new Date().getFullYear())) - 1) * 100).toFixed(1)}%
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Area Map Card */}
                                <div className="card p-0 overflow-hidden border-2 border-slate-200 h-[450px]">
                                    <MapComponent
                                        lat={prediction.location.lat}
                                        lng={prediction.location.lng}
                                        label={prediction.location.name}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                                {/* Market Trend Chart */}
                                <div className="lg:col-span-2 card">
                                    <h4 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                        <i className="fas fa-history text-indigo-600"></i>
                                        Growth Trend Projection
                                    </h4>
                                    <div className="h-80 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={prediction.trendHistory}>
                                                <defs>
                                                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} tickMargin={10} />
                                                <YAxis
                                                    stroke="#94a3b8"
                                                    fontSize={12}
                                                    tickFormatter={(value) => `${(value / 100000).toFixed(1)}L`}
                                                />
                                                <Tooltip
                                                    formatter={(value: number) => [formatINR(value), 'Value']}
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                                />
                                                <Area type="monotone" dataKey="price" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* AI Explanation */}
                                <div className="card bg-indigo-50 border-indigo-100">
                                    <h4 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
                                        <i className="fas fa-robot text-indigo-600"></i>
                                        AI Insights
                                    </h4>
                                    <p className="text-indigo-800 leading-relaxed text-sm">
                                        {prediction.explanation}
                                    </p>
                                    <div className="mt-6 pt-6 border-t border-indigo-200">
                                        <div className="flex items-center gap-3 text-indigo-700 text-sm font-bold">
                                            <i className="fas fa-shield-check text-green-600"></i>
                                            Confidence Score: 94%
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <DutyCalculator
                                price={prediction.currentPrice}
                                initialState={selectedState}
                                initialPropertyType={propertyType}
                            />

                            <div className="mt-8 text-center">
                                <span className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-500 rounded-full text-xs font-bold uppercase tracking-wider">
                                    <i className="fas fa-info-circle"></i>
                                    Prices shown are statistical estimates based on current trends
                                </span>
                            </div>

                            {/* Property Report */}
                            {prediction.report && (
                                <PropertyReportComponent
                                    report={prediction.report}
                                    location={`${landmark}, ${district}, ${selectedState}`}
                                />
                            )}
                        </div>
                    )}
                </div>
            </section>

            <Services />
            <div className="max-w-7xl mx-auto px-6 py-20">
                <BankOffers />
            </div>
            <Testimonials />
            <Contact />

            <footer className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-slate-300 py-20 border-t border-slate-700 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                        <div className="lg:col-span-1">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur">
                                    <i className="fas fa-building text-white"></i>
                                </div>
                                <span className="text-2xl font-black text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                    Propridict <span className="text-indigo-400">AI</span>
                                </span>
                            </div>
                            <p className="text-slate-400 mb-6 leading-relaxed">
                                Empowering property buyers and investors with AI-driven market intelligence across all major Indian cities and states.
                            </p>
                            <div className="flex gap-4">
                                <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-indigo-600 transition-colors">
                                    <i className="fab fa-facebook-f text-sm"></i>
                                </a>
                                <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-indigo-600 transition-colors">
                                    <i className="fab fa-twitter text-sm"></i>
                                </a>
                                <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-indigo-600 transition-colors">
                                    <i className="fab fa-linkedin-in text-sm"></i>
                                </a>
                                <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-indigo-600 transition-colors">
                                    <i className="fab fa-instagram text-sm"></i>
                                </a>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-6 uppercase text-sm tracking-wider">Quick Links</h4>
                            <ul className="space-y-4">
                                <li><a href="#home" className="hover:text-white transition-colors">Home</a></li>
                                <li><a href="#predict" className="hover:text-white transition-colors">AI Predictor</a></li>
                                <li><a href="#services" className="hover:text-white transition-colors">Our Services</a></li>
                                <li><a href="#offers" className="hover:text-white transition-colors">Bank Offers</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-6 uppercase text-sm tracking-wider">Support</h4>
                            <ul className="space-y-4">
                                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Contact Support</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-6 uppercase text-sm tracking-wider">Newsletter</h4>
                            <p className="text-sm text-slate-400 mb-4">Get weekly market insights and price update alerts.</p>
                            <div className="relative">
                                <input
                                    type="email"
                                    placeholder="your@email.com"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                />
                                <button className="absolute right-2 top-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white text-xs font-bold transition-colors">
                                    Join
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="text-slate-500 text-sm font-medium">
                            &copy; {new Date().getFullYear()} Propridict AI. All rights reserved.
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500 font-bold uppercase tracking-widest">
                            <span>Engineered with AI</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                            <span>Pan-India Coverage</span>
                        </div>
                    </div>
                </div>
            </footer>

            <ChatBot />
        </div>
    );
};

export default App;
