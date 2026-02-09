"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calculator, DollarSign, Clock, Users, FileText, ArrowRight } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

export function ROICalculator() {
    // Default values
    const [technicians, setTechnicians] = useState([5]);
    const [ordersPerTech, setOrdersPerTech] = useState([20]);
    const [hourlyCost, setHourlyCost] = useState([45]);

    // Derived values
    const [annualSavings, setAnnualSavings] = useState(0);
    const [hoursSaved, setHoursSaved] = useState(0);

    // Constants based on RAG efficiency
    // Assuming RAG saves ~30 mins (0.5h) per complex complex order analysis vs manual
    const HOURS_SAVED_PER_ORDER = 0.5;

    useEffect(() => {
        const totalOrdersMonth = technicians[0] * ordersPerTech[0];
        const totalOrdersYear = totalOrdersMonth * 12;

        // Calculate hours saved
        const totalHoursSavedYear = totalOrdersYear * HOURS_SAVED_PER_ORDER;
        setHoursSaved(Math.round(totalHoursSavedYear));

        // Calculate money saved
        const totalMoneySaved = totalHoursSavedYear * hourlyCost[0];
        setAnnualSavings(Math.round(totalMoneySaved));
    }, [technicians, ordersPerTech, hourlyCost]);

    return (
        <section className="py-24 bg-slate-900 relative overflow-hidden">
            {/* Background gradients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                <SectionHeading
                    badge="ROI CALCULATOR"
                    title="Calculate Your Potential Savings"
                    description="See how much your team could save by automating technical analysis with ABD RAG Platform."
                />

                <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
                    {/* Controls */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 space-y-8"
                    >
                        {/* Technicians Slider */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-slate-200 font-medium">
                                    <Users className="w-5 h-5 text-teal-400" />
                                    <span>Number of Technicians</span>
                                </div>
                                <span className="text-2xl font-bold text-white">{technicians[0]}</span>
                            </div>
                            <Slider
                                value={technicians}
                                onValueChange={setTechnicians}
                                min={1}
                                max={100}
                                step={1}
                                className="py-4"
                            />
                            <p className="text-xs text-slate-500">Field technicians or engineers analyzing orders.</p>
                        </div>

                        {/* Orders Slider */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-slate-200 font-medium">
                                    <FileText className="w-5 h-5 text-teal-400" />
                                    <span>Orders per Tech / Month</span>
                                </div>
                                <span className="text-2xl font-bold text-white">{ordersPerTech[0]}</span>
                            </div>
                            <Slider
                                value={ordersPerTech}
                                onValueChange={setOrdersPerTech}
                                min={1}
                                max={200}
                                step={1}
                                className="py-4"
                            />
                            <p className="text-xs text-slate-500">Average number of technical specs analyzed per person.</p>
                        </div>

                        {/* Hourly Cost Slider */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-slate-200 font-medium">
                                    <DollarSign className="w-5 h-5 text-teal-400" />
                                    <span>Avg. Hourly Internal Cost (€)</span>
                                </div>
                                <span className="text-2xl font-bold text-white">{hourlyCost[0]}€</span>
                            </div>
                            <Slider
                                value={hourlyCost}
                                onValueChange={setHourlyCost}
                                min={15}
                                max={200}
                                step={5}
                                className="py-4"
                            />
                            <p className="text-xs text-slate-500">Fully loaded cost per hour (salary + overhead).</p>
                        </div>
                    </motion.div>

                    {/* Results */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="lg:pl-8 space-y-8"
                    >
                        <div className="bg-gradient-to-br from-teal-500/10 to-emerald-500/10 border border-teal-500/20 rounded-2xl p-8 text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Calculator className="w-32 h-32 text-teal-500" />
                            </div>

                            <h3 className="text-slate-400 font-medium mb-2 uppercase tracking-wide">Estimated Annual Savings</h3>
                            <div className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400 mb-4">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(annualSavings)}
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-700/50">
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-2 text-slate-400 mb-1">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-sm">Hours Saved / Year</span>
                                    </div>
                                    <div className="text-2xl font-bold text-white">{new Intl.NumberFormat('en-US').format(hoursSaved)} h</div>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-2 text-slate-400 mb-1">
                                        <FileText className="w-4 h-4" />
                                        <span className="text-sm">Orders Analyzed</span>
                                    </div>
                                    <div className="text-2xl font-bold text-white">{new Intl.NumberFormat('en-US').format(technicians[0] * ordersPerTech[0] * 12)}</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
                            <h4 className="font-semibold text-white mb-2">How is this calculated?</h4>
                            <p className="text-slate-400 text-sm mb-4">
                                We estimate that ABD RAG AI reduces the time to analyze a complex technical specification by approximately <strong>30 minutes per order</strong> compared to manual review, drastically reducing error rates and "back-and-forth" clarifications.
                            </p>
                            <Button className="w-full sm:w-auto bg-white text-slate-900 hover:bg-slate-200">
                                START YOUR FREE TRIAL <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
