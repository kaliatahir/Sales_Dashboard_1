// ============================================================
// SALES DASHBOARD - dashboard.js
// ============================================================

const STORAGE_KEY = "salesDashboardData";

let salesData = [];
let filteredData = [];

let salesTrendChart = null;
let regionChart = null;
let categoryChart = null;
let repChart = null;
let customerChart = null;
let channelChart = null;


// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener("DOMContentLoaded", function () {

    loadCSV();
    setupFilterListeners();

});


// ============================================================
// LOAD CSV / LOCAL STORAGE
// ============================================================

async function loadCSV() {

    try {

        const savedData = localStorage.getItem(STORAGE_KEY);

        if (savedData) {

            salesData = JSON.parse(savedData);

            filteredData = [...salesData];

            initializeDashboard();

            return;
        }


        const response = await fetch("Sales_dashboard_arzan\data");

        if (!response.ok) {
            throw new Error("Unable to load sales_data.csv");
        }


        const csvText = await response.text();

        salesData = parseCSV(csvText);

        filteredData = [...salesData];


        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(salesData)
        );


        initializeDashboard();

    } catch (error) {

        console.error("Error loading CSV:", error);

        const tableBody =
            document.getElementById("salesTableBody");

        if (tableBody) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align:center;">
                        Unable to load sales data.
                    </td>
                </tr>
            `;
        }
    }
}


// ============================================================
// CSV PARSER
// ============================================================

function parseCSV(csvText) {

    const rows = [];

    let row = [];
    let value = "";
    let insideQuotes = false;


    for (let i = 0; i < csvText.length; i++) {

        const char = csvText[i];
        const nextChar = csvText[i + 1];


        if (char === '"' && insideQuotes && nextChar === '"') {

            value += '"';

            i++;

        } else if (char === '"') {

            insideQuotes = !insideQuotes;

        } else if (char === "," && !insideQuotes) {

            row.push(value.trim());

            value = "";

        } else if (
            (char === "\n" || char === "\r") &&
            !insideQuotes
        ) {

            if (char === "\r" && nextChar === "\n") {
                i++;
            }

            row.push(value.trim());

            if (row.some(cell => cell !== "")) {
                rows.push(row);
            }

            row = [];
            value = "";

        } else {

            value += char;
        }
    }


    if (value !== "" || row.length > 0) {

        row.push(value.trim());

        if (row.some(cell => cell !== "")) {
            rows.push(row);
        }
    }


    if (rows.length === 0) {
        return [];
    }


    const headers = rows[0];


    return rows.slice(1).map(row => {

        const object = {};

        headers.forEach((header, index) => {

            object[header.trim()] =
                row[index] !== undefined
                    ? row[index].trim()
                    : "";
        });

        return object;
    });
}


// ============================================================
// INITIALIZE DASHBOARD
// ============================================================

function initializeDashboard() {

    populateFilters();

    updateDashboard();

}


// ============================================================
// FILTER LISTENERS
// ============================================================

function setupFilterListeners() {

    const regionFilter =
        document.getElementById("regionFilter");

    const categoryFilter =
        document.getElementById("categoryFilter");

    const repFilter =
        document.getElementById("repFilter");

    const channelFilter =
        document.getElementById("channelFilter");

    const resetButton =
        document.getElementById("resetFilters");


    if (regionFilter) {

        regionFilter.addEventListener(
            "change",
            applyFilters
        );
    }


    if (categoryFilter) {

        categoryFilter.addEventListener(
            "change",
            applyFilters
        );
    }


    if (repFilter) {

        repFilter.addEventListener(
            "change",
            applyFilters
        );
    }


    if (channelFilter) {

        channelFilter.addEventListener(
            "change",
            applyFilters
        );
    }


    if (resetButton) {

        resetButton.addEventListener(
            "click",
            resetFilters
        );
    }

}


// ============================================================
// POPULATE FILTERS
// ============================================================

function populateFilters() {

    populateNormalFilter(
        "regionFilter",
        "Region"
    );


    populateNormalFilter(
        "categoryFilter",
        "Product_Category"
    );


    populateNormalFilter(
        "repFilter",
        "Sales_Rep"
    );


    populateNormalFilter(
        "channelFilter",
        "Sales_Channel"
    );

}


// ============================================================
// NORMAL DROPDOWN FILTER
// ============================================================

function populateNormalFilter(
    elementId,
    field
) {

    const select =
        document.getElementById(elementId);

    if (!select) {
        return;
    }


    const currentValue =
        select.value;


    const values = [
        ...new Set(
            salesData
                .map(row => row[field])
                .filter(value =>
                    value !== undefined &&
                    value !== null &&
                    String(value).trim() !== ""
                )
        )
    ].sort();


    select.innerHTML = `
        <option value="">All</option>
    `;


    values.forEach(value => {

        const option =
            document.createElement("option");

        option.value = value;

        option.textContent = value;

        select.appendChild(option);
    });


    if (
        values.includes(currentValue)
    ) {

        select.value = currentValue;
    }
}



// ============================================================
// APPLY FILTERS
// ============================================================

function applyFilters() {

    const region =
        getValue("regionFilter");


    const category =
        getValue("categoryFilter");


    const rep =
        getValue("repFilter");


    const channel =
        getValue("channelFilter");


    filteredData =
        salesData.filter(row => {


            if (
                region &&
                row.Region !== region
            ) {

                return false;
            }


            if (
                category &&
                row.Product_Category !== category
            ) {

                return false;
            }


            if (
                rep &&
                row.Sales_Rep !== rep
            ) {

                return false;
            }


            if (
                channel &&
                row.Sales_Channel !== channel
            ) {

                return false;
            }


            return true;
        });


    updateDashboard();
}


// ============================================================
// RESET ALL FILTERS
// ============================================================

function resetFilters() {

    const filters = [
        "regionFilter",
        "categoryFilter",
        "repFilter",
        "channelFilter"
    ];


    filters.forEach(id => {

        const element =
            document.getElementById(id);

        if (element) {

            element.value = "";
        }
    });


    filteredData =
        [...salesData];


    updateDashboard();
}


// ============================================================
// UPDATE ENTIRE DASHBOARD
// ============================================================

function updateDashboard() {

    updateKPIs();

    updateCharts();

    updateInsights();

    updateTable();
}


// ============================================================
// UPDATE KPI CARDS
// ============================================================

function updateKPIs() {

    let totalSales = 0;

    let totalQuantity = 0;


    filteredData.forEach(row => {

        totalSales +=
            parseNumber(
                row.Sales_Amount
            );


        totalQuantity +=
            parseNumber(
                row.Quantity_Sold
            );
    });


    const averageSale =
        filteredData.length > 0
            ? totalSales /
              filteredData.length
            : 0;


    const reps = [
        ...new Set(
            filteredData
                .map(row =>
                    row.Sales_Rep
                )
                .filter(Boolean)
        )
    ];


    setText(
        "totalSales",
        formatCurrency(totalSales)
    );


    setText(
        "totalQuantity",
        totalQuantity.toLocaleString()
    );


    setText(
        "averageSale",
        formatCurrency(averageSale)
    );


    setText(
        "totalReps",
        reps.length.toLocaleString()
    );
}


// ============================================================
// UPDATE CHARTS
// ============================================================

function updateCharts() {

    updateSalesTrendChart();

    updateRegionChart();

    updateCategoryChart();

    updateRepChart();

    updateCustomerChart();

    updateChannelChart();
}


// ============================================================
// SALES TREND CHART
// ============================================================

function updateSalesTrendChart() {

    const canvas =
        document.getElementById(
            "salesTrendChart"
        );


    if (!canvas) {
        return;
    }


    const grouped = {};


    filteredData.forEach(row => {

        const date =
            parseSaleDate(
                row.Sale_Date
            );


        if (!date) {
            return;
        }


        const key =
            `${date.getFullYear()}-${String(
                date.getMonth() + 1
            ).padStart(2, "0")}`;


        if (!grouped[key]) {
            grouped[key] = 0;
        }


        grouped[key] +=
            parseNumber(
                row.Sales_Amount
            );
    });


    const keys =
        Object.keys(grouped).sort();


    const labels =
        keys.map(key => {

            const [year, month] =
                key.split("-");

            const date =
                new Date(
                    Number(year),
                    Number(month) - 1
                );


            return date.toLocaleDateString(
                "en-US",
                {
                    month: "short",
                    year: "numeric"
                }
            );
        });


    const values =
        keys.map(key =>
            grouped[key]
        );


    if (salesTrendChart) {
        salesTrendChart.destroy();
    }


    const ctx =
        canvas.getContext("2d");


    salesTrendChart =
        new Chart(ctx, {

            type: "line",

            data: {

                labels: labels,

                datasets: [
                    {
                        label: "Sales",

                        data: values,

                        borderWidth: 2,

                        fill: true,

                        tension: 0.3
                    }
                ]
            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {
                        display: false
                    },

                    tooltip: {

                        callbacks: {

                            label: function (
                                context
                            ) {

                                return formatCurrency(
                                    context.raw
                                );
                            }
                        }
                    }
                },

                scales: {

                    y: {

                        beginAtZero: true,

                        ticks: {

                            callback: function (
                                value
                            ) {

                                return formatCompactCurrency(
                                    value
                                );
                            }
                        }
                    }
                }
            }
        });
}


// ============================================================
// REGION CHART
// ============================================================

function updateRegionChart() {

    const canvas =
        document.getElementById(
            "regionChart"
        );


    if (!canvas) {
        return;
    }


    const grouped =
        groupSalesBy("Region");


    const labels =
        Object.keys(grouped);


    const values =
        Object.values(grouped);


    if (regionChart) {
        regionChart.destroy();
    }


    regionChart =
        new Chart(
            canvas.getContext("2d"),
            {

                type: "bar",

                data: {

                    labels: labels,

                    datasets: [
                        {
                            label: "Sales",

                            data: values,

                            borderWidth: 1
                        }
                    ]
                },

                options: {

                    indexAxis: "y",

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            display: false
                        },

                        tooltip: {

                            callbacks: {

                                label: function (
                                    context
                                ) {

                                    return formatCurrency(
                                        context.raw
                                    );
                                }
                            }
                        }
                    }
                }
            }
        );
}


// ============================================================
// CATEGORY CHART
// ============================================================

function updateCategoryChart() {

    const canvas =
        document.getElementById(
            "categoryChart"
        );


    if (!canvas) {
        return;
    }


    const grouped =
        groupSalesBy(
            "Product_Category"
        );


    const labels =
        Object.keys(grouped);


    const values =
        Object.values(grouped);


    if (categoryChart) {
        categoryChart.destroy();
    }


    categoryChart =
        new Chart(
            canvas.getContext("2d"),
            {

                type: "doughnut",

                data: {

                    labels: labels,

                    datasets: [
                        {
                            data: values,

                            borderWidth: 1
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        tooltip: {

                            callbacks: {

                                label: function (
                                    context
                                ) {

                                    return (
                                        context.label +
                                        ": " +
                                        formatCurrency(
                                            context.raw
                                        )
                                    );
                                }
                            }
                        }
                    }
                }
            }
        );
}


// ============================================================
// SALES REP CHART
// ============================================================

function updateRepChart() {

    const canvas =
        document.getElementById(
            "repChart"
        );


    if (!canvas) {
        return;
    }


    const grouped =
        groupSalesBy(
            "Sales_Rep"
        );


    const sorted =
        Object.entries(grouped)
            .sort(
                (a, b) =>
                    b[1] - a[1]
            )
            .slice(0, 7);


    const labels =
        sorted.map(item =>
            item[0]
        );


    const values =
        sorted.map(item =>
            item[1]
        );


    if (repChart) {
        repChart.destroy();
    }


    repChart =
        new Chart(
            canvas.getContext("2d"),
            {

                type: "bar",

                data: {

                    labels: labels,

                    datasets: [
                        {
                            label: "Sales",

                            data: values,

                            borderWidth: 1
                        }
                    ]
                },

                options: {

                    indexAxis: "y",

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            display: false
                        },

                        tooltip: {

                            callbacks: {

                                label: function (
                                    context
                                ) {

                                    return formatCurrency(
                                        context.raw
                                    );
                                }
                            }
                        }
                    }
                }
            }
        );
}


// ============================================================
// CUSTOMER TYPE CHART
// ============================================================

function updateCustomerChart() {

    const canvas =
        document.getElementById(
            "customerChart"
        );


    if (!canvas) {
        return;
    }


    const grouped =
        groupSalesBy(
            "Customer_Type"
        );


    const labels =
        Object.keys(grouped);


    const values =
        Object.values(grouped);


    if (customerChart) {
        customerChart.destroy();
    }


    customerChart =
        new Chart(
            canvas.getContext("2d"),
            {

                type: "doughnut",

                data: {

                    labels: labels,

                    datasets: [
                        {
                            data: values,

                            borderWidth: 1
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        tooltip: {

                            callbacks: {

                                label: function (
                                    context
                                ) {

                                    return (
                                        context.label +
                                        ": " +
                                        formatCurrency(
                                            context.raw
                                        )
                                    );
                                }
                            }
                        }
                    }
                }
            }
        );
}


// ============================================================
// SALES CHANNEL CHART
// ============================================================

function updateChannelChart() {

    const canvas =
        document.getElementById(
            "channelChart"
        );


    if (!canvas) {
        return;
    }


    const grouped =
        groupSalesBy(
            "Sales_Channel"
        );


    const labels =
        Object.keys(grouped);


    const values =
        Object.values(grouped);


    if (channelChart) {
        channelChart.destroy();
    }


    channelChart =
        new Chart(
            canvas.getContext("2d"),
            {

                type: "bar",

                data: {

                    labels: labels,

                    datasets: [
                        {
                            label: "Sales",

                            data: values,

                            borderWidth: 1
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            display: false
                        },

                        tooltip: {

                            callbacks: {

                                label: function (
                                    context
                                ) {

                                    return formatCurrency(
                                        context.raw
                                    );
                                }
                            }
                        }
                    }
                }
            }
        );
}


// ============================================================
// GROUP SALES
// ============================================================

function groupSalesBy(field) {

    const grouped = {};


    filteredData.forEach(row => {

        const key =
            row[field] ||
            "Unknown";


        if (!grouped[key]) {
            grouped[key] = 0;
        }


        grouped[key] +=
            parseNumber(
                row.Sales_Amount
            );
    });


    return grouped;
}


// ============================================================
// INSIGHTS
// ============================================================

function updateInsights() {

    const topRegion =
        getTopGroup("Region");


    const topCategory =
        getTopGroup(
            "Product_Category"
        );


    const topRep =
        getTopGroup(
            "Sales_Rep"
        );


    let highestSale = 0;


    filteredData.forEach(row => {

        const amount =
            parseNumber(
                row.Sales_Amount
            );


        if (amount > highestSale) {
            highestSale = amount;
        }
    });


    setText(
        "topRegion",
        topRegion
            ? topRegion.name
            : "-"
    );


    setText(
        "topCategory",
        topCategory
            ? topCategory.name
            : "-"
    );


    setText(
        "topRep",
        topRep
            ? topRep.name
            : "-"
    );


    setText(
        "highestSale",
        formatCurrency(
            highestSale
        )
    );
}


// ============================================================
// GET TOP GROUP
// ============================================================

function getTopGroup(field) {

    const grouped =
        groupSalesBy(field);


    const entries =
        Object.entries(grouped);


    if (entries.length === 0) {
        return null;
    }


    entries.sort(
        (a, b) =>
            b[1] - a[1]
    );


    return {

        name: entries[0][0],

        value: entries[0][1]
    };
}


// ============================================================
// UPDATE TABLE
// ============================================================

function updateTable() {

    const tableBody =
        document.getElementById(
            "salesTableBody"
        );


    if (!tableBody) {
        return;
    }


    tableBody.innerHTML = "";


    const recentData =
        [...filteredData]
            .sort(
                (a, b) => {

                    const dateA =
                        parseSaleDate(
                            a.Sale_Date
                        );

                    const dateB =
                        parseSaleDate(
                            b.Sale_Date
                        );


                    if (!dateA && !dateB) {
                        return 0;
                    }


                    if (!dateA) {
                        return 1;
                    }


                    if (!dateB) {
                        return -1;
                    }


                    return dateB - dateA;
                }
            )
            .slice(0, 10);


    if (recentData.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    style="text-align:center;"
                >
                    No records found
                </td>
            </tr>
        `;

        setText(
            "dashboardRecordCount",
            "0 records"
        );

        return;
    }


    recentData.forEach(row => {

        const tr =
            document.createElement("tr");


        tr.innerHTML = `

            <td>
                ${escapeHTML(
                    row.Product_ID
                )}
            </td>

            <td>
                ${escapeHTML(
                    row.Sale_Date
                )}
            </td>

            <td>
                ${escapeHTML(
                    row.Sales_Rep
                )}
            </td>

            <td>
                ${escapeHTML(
                    row.Region
                )}
            </td>

            <td>
                ${escapeHTML(
                    row.Product_Category
                )}
            </td>

            <td>
                ${formatNumber(
                    row.Quantity_Sold
                )}
            </td>

            <td>
                ${formatCurrency(
                    parseNumber(
                        row.Sales_Amount
                    )
                )}
            </td>

            <td>
                ${escapeHTML(
                    row.Sales_Channel
                )}
            </td>

        `;


        tableBody.appendChild(tr);
    });


    setText(
        "dashboardRecordCount",
        `${filteredData.length.toLocaleString()} records`
    );
}


// ============================================================
// DATE PARSER
// ============================================================

function parseSaleDate(value) {

    if (!value) {
        return null;
    }


    const stringValue =
        String(value).trim();


    // DD/MM/YYYY
    const match =
        stringValue.match(
            /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/
        );


    if (match) {

        const day =
            Number(match[1]);

        const month =
            Number(match[2]) - 1;

        const year =
            Number(match[3]);


        const date =
            new Date(
                year,
                month,
                day
            );


        if (
            date.getFullYear() === year &&
            date.getMonth() === month &&
            date.getDate() === day
        ) {

            return date;
        }
    }


    // YYYY-MM-DD
    const isoMatch =
        stringValue.match(
            /^(\d{4})-(\d{1,2})-(\d{1,2})$/
        );


    if (isoMatch) {

        const year =
            Number(isoMatch[1]);

        const month =
            Number(isoMatch[2]) - 1;

        const day =
            Number(isoMatch[3]);


        return new Date(
            year,
            month,
            day
        );
    }


    const parsed =
        new Date(stringValue);


    if (
        !isNaN(
            parsed.getTime()
        )
    ) {

        return parsed;
    }


    return null;
}


// ============================================================
// NUMBER PARSER
// ============================================================

function parseNumber(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return 0;
    }


    const cleaned =
        String(value)
            .replace(
                /[^0-9.-]/g,
                ""
            );


    const number =
        Number(cleaned);


    return isNaN(number)
        ? 0
        : number;
}


// ============================================================
// FORMAT NUMBER
// ============================================================

function formatNumber(value) {

    return parseNumber(
        value
    ).toLocaleString(
        "en-US"
    );
}


// ============================================================
// FORMAT CURRENCY
// ============================================================

function formatCurrency(value) {

    return new Intl.NumberFormat(
        "en-US",
        {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    ).format(
        parseNumber(value)
    );
}


// ============================================================
// COMPACT CURRENCY
// ============================================================

function formatCompactCurrency(value) {

    const number =
        parseNumber(value);


    if (number >= 1000000) {

        return (
            "$" +
            (
                number / 1000000
            ).toFixed(1) +
            "M"
        );
    }


    if (number >= 1000) {

        return (
            "$" +
            (
                number / 1000
            ).toFixed(1) +
            "K"
        );
    }


    return "$" +
        number.toFixed(0);
}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


// ============================================================
// GET ELEMENT VALUE
// ============================================================

function getValue(id) {

    const element =
        document.getElementById(id);


    if (!element) {
        return "";
    }


    return element.value || "";
}


// ============================================================
// SET TEXT
// ============================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;
    }
}


// ============================================================
// LOCAL STORAGE SYNC
// ============================================================

window.addEventListener(
    "storage",
    function (event) {

        if (
            event.key !== STORAGE_KEY
        ) {

            return;
        }


        if (!event.newValue) {

            return;
        }


        try {

            salesData =
                JSON.parse(
                    event.newValue
                );


            filteredData =
                [...salesData];


            populateFilters();

            updateDashboard();

        } catch (error) {

            console.error(
                "Error syncing dashboard:",
                error
            );
        }
    }
);