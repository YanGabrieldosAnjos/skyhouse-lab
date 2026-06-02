// =========================================================
// SkyHouse Agency — Full Stack Developer Assessment
// Part 3: Bug Hunt
// File: campaign-dashboard.js
// This file contains FIVE intentional bugs. Find and fix them.
// =========================================================
const express = require("express");
const fs = require("fs");
const csv = require("csv-parser");

const app = express();
app.use(express.json()); // BUG 1: express.json is a function — must be called as express.json()
// Load campaign data from CSV
async function loadCampaignData(filePath) {
    const results = [];
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", (data) => results.push(data))
            .on("end", () => resolve(results))
            .on("error", (err) => reject(err));
    });
}
// Calculate ROAS for each campaign
function calculateMetrics(campaigns) {
    return campaigns.map(c => {
        const spend = parseFloat(c.spend);
        const revenue = parseFloat(c.revenue);
        const conversions = parseInt(c.conversions);
        const roas = spend > 0 ? revenue / spend : 0; // BUG 2: ROAS = revenue / spend, not spend / revenue
        const cpa = conversions > 0 ? spend / conversions : 0; // BUG 3: CPA = spend / conversions, not conversions / spend
        return { ...c, roas: roas.toFixed(2), cpa: cpa.toFixed(2) };
    });
}
// GET /api/campaigns — return all campaigns with metrics
app.get('/api/campaigns', async (req, res) => {
try {
    const raw = await loadCampaignData("./data/campaigns.csv");
    const campaigns = calculateMetrics(raw);
    res.json({ success: true, data: campaigns });
} catch (err) {
    res.status(500).json({ success: false, error: err.message }); // BUG 4: Should send err.message, not the full Error object (exposes stack trace)
}
});
// POST /api/campaigns/filter — filter by min ROAS
app.post('/api/campaigns/filter', async (req, res) => {
    try {
        const minRoas = parseFloat(req.body?.minRoas);
        if (Number.isNaN(minRoas)) {
            return res.status(400).json({ success: false, error: "minRoas must be a number" });
        }
        const raw = await loadCampaignData("./data/campaigns.csv");
        const campaigns = calculateMetrics(raw);
        const filtered = campaigns.filter(c => parseFloat(c.roas) >= minRoas);
        res.json({ success: true, data: filtered });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// GET /api/summary — return aggregate stats
app.get('/api/summary', async (req, res) => {
    try {
        const raw = await loadCampaignData("./data/campaigns.csv");
        const campaigns = calculateMetrics(raw);
        const totalSpend = campaigns.reduce((acc, c) => acc + parseFloat(c.spend), 0);
        const totalRevenue = campaigns.reduce((acc, c) => acc + parseFloat(c.revenue), 0); // BUG 5: c.spend is a string from CSV — must use parseFloat(c.spend) or it will concatenate strings
        const overallRoas = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : "0.00"; 
        res.json({ totalSpend, totalRevenue, overallRoas });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
app.listen(3000, () => console.log("Server running on port 3000"));