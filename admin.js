// ============================================================
// SALES ADMIN PANEL
// CRUD + SEARCH + PAGINATION + IMPORT + EXPORT + LOGIN
// ============================================================

const STORAGE_KEY = "salesDashboardData";

const ADMIN_USERNAME = "Admin";

const ADMIN_PASSWORD = "Admin123";

const AUTH_KEY = "adminAuthenticated";


let salesData = [];

let filteredData = [];

let currentPage = 1;

const rowsPerPage = 25;


// ============================================================
// START
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        checkAuthentication();

        setupSearch();

    }
);


// ============================================================
// AUTHENTICATION
// ============================================================

function checkAuthentication() {

    const isAuthenticated =
        sessionStorage.getItem(
            AUTH_KEY
        ) === "true";


    const overlay =
        document.getElementById(
            "adminLoginOverlay"
        );


    const mainContent =
        document.getElementById(
            "adminMainContent"
        );


    if (
        isAuthenticated &&
        overlay &&
        mainContent
    ) {

        overlay.style.display =
            "none";


        mainContent.style.display =
            "block";


        loadData();

    }

}


function handleLogin(event) {

    event.preventDefault();


    const usernameInput =
        document.getElementById(
            "adminUsername"
        );


    const passwordInput =
        document.getElementById(
            "adminPassword"
        );


    if (
        !usernameInput ||
        !passwordInput
    ) {

        return;

    }


    const username =
        usernameInput.value.trim();


    const password =
        passwordInput.value.trim();


    if (
        username === ADMIN_USERNAME &&
        password === ADMIN_PASSWORD
    ) {

        sessionStorage.setItem(
            AUTH_KEY,
            "true"
        );


        const overlay =
            document.getElementById(
                "adminLoginOverlay"
            );


        const mainContent =
            document.getElementById(
                "adminMainContent"
            );


        if (overlay) {

            overlay.style.display =
                "none";

        }


        if (mainContent) {

            mainContent.style.display =
                "block";

        }


        usernameInput.value = "";


        passwordInput.value = "";


        loadData();

    }

    else {

        alert(
            "Invalid username or password."
        );

    }

}


function logout() {

    sessionStorage.removeItem(
        AUTH_KEY
    );


    const overlay =
        document.getElementById(
            "adminLoginOverlay"
        );


    const mainContent =
        document.getElementById(
            "adminMainContent"
        );


    if (overlay) {

        overlay.style.display =
            "flex";

    }


    if (mainContent) {

        mainContent.style.display =
            "none";

    }

}


// ============================================================
// LOAD DATA
// ============================================================

async function loadData() {

    try {

        const savedData =
            localStorage.getItem(
                STORAGE_KEY
            );


        if (savedData) {

            salesData =
                JSON.parse(
                    savedData
                );

            console.log(
                "Loaded from localStorage:",
                salesData.length
            );

        }

        else {

            const response =
                await fetch(
                    "data/sales_data.csv"
                );


            if (!response.ok) {

                throw new Error(
                    "Unable to load CSV"
                );

            }


            const csvText =
                await response.text();


            salesData =
                parseCSV(
                    csvText
                );


            saveToLocalStorage();

        }


        filteredData =
            [...salesData];


        displaySales();


        updateStatistics();

    }

    catch (error) {

        console.error(
            error
        );


        alert(
            "Unable to load sales data.\n\n" +
            "Make sure you are using Live Server."
        );

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


    for (
        let i = 0;
        i < csvText.length;
        i++
    ) {

        const char =
            csvText[i];

        const nextChar =
            csvText[i + 1];


        if (
            char === '"' &&
            insideQuotes &&
            nextChar === '"'
        ) {

            value += '"';

            i++;

        }

        else if (
            char === '"'
        ) {

            insideQuotes =
                !insideQuotes;

        }

        else if (
            char === "," &&
            !insideQuotes
        ) {

            row.push(
                value.trim()
            );

            value = "";

        }

        else if (
            (
                char === "\n" ||
                char === "\r"
            ) &&
            !insideQuotes
        ) {

            if (
                char === "\r" &&
                nextChar === "\n"
            ) {

                i++;

            }


            row.push(
                value.trim()
            );

            value = "";


            if (
                row.some(
                    cell => cell !== ""
                )
            ) {

                rows.push(row);

            }


            row = [];

        }

        else {

            value += char;

        }

    }


    if (
        value !== "" ||
        row.length > 0
    ) {

        row.push(
            value.trim()
        );


        if (
            row.some(
                cell => cell !== ""
            )
        ) {

            rows.push(row);

        }

    }


    if (
        rows.length === 0
    ) {

        return [];

    }


    const headers =
        rows[0];


    return rows
        .slice(1)
        .map(row => {

            const object = {};


            headers.forEach(
                (
                    header,
                    index
                ) => {

                    object[header] =
                        row[index] || "";

                }
            );


            return object;

        });

}


// ============================================================
// SAVE LOCAL STORAGE
// ============================================================

function saveToLocalStorage() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
            salesData
        )
    );

}


// ============================================================
// DISPLAY SALES
// ============================================================

function displaySales() {

    const tableBody =
        document.getElementById(
            "adminTableBody"
        );


    if (!tableBody) {

        return;

    }


    tableBody.innerHTML = "";


    updateRecordCount();


    if (
        filteredData.length === 0
    ) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="15"
                    class="no-records"
                >
                    No sales records found
                </td>

            </tr>

        `;


        updatePagination();

        return;

    }


    const startIndex =
        (
            currentPage - 1
        ) *
        rowsPerPage;


    const endIndex =
        startIndex +
        rowsPerPage;


    const pageData =
        filteredData.slice(
            startIndex,
            endIndex
        );


    pageData.forEach(
        item => {

            const actualIndex =
                salesData.indexOf(
                    item
                );


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${escapeHTML(
                        item.Product_ID
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        item.Sale_Date
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        item.Sales_Rep
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        item.Region
                    )}
                </td>

                <td class="amount-cell">
                    ${formatCurrency(
                        item.Sales_Amount
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        item.Quantity_Sold
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        item.Product_Category
                    )}
                </td>

                <td>
                    ${formatCurrency(
                        item.Unit_Cost
                    )}
                </td>

                <td>
                    ${formatCurrency(
                        item.Unit_Price
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        item.Customer_Type
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        item.Discount
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        item.Payment_Method
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        item.Sales_Channel
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        item.Region_and_Sales_Rep
                    )}
                </td>

                <td>

                    <div class="action-buttons">

                        <button
                            class="edit-button"
                            onclick="editSale(${actualIndex})"
                        >
                            Edit
                        </button>

                        <button
                            class="delete-button"
                            onclick="deleteSale(${actualIndex})"
                        >
                            Delete
                        </button>

                    </div>

                </td>

            `;


            tableBody.appendChild(
                row
            );

        }
    );


    updatePagination();

}


// ============================================================
// STATISTICS
// ============================================================

function updateStatistics() {

    const totalRecords =
        salesData.length;


    const totalSales =
        salesData.reduce(
            (sum, item) => {

                return (
                    sum +
                    parseNumber(
                        item.Sales_Amount
                    )
                );

            },
            0
        );


    const averageSale =
        totalRecords > 0
            ? totalSales /
              totalRecords
            : 0;


    const totalRecordsElement =
        document.getElementById(
            "totalRecords"
        );


    const totalSalesElement =
        document.getElementById(
            "adminTotalSales"
        );


    const averageSaleElement =
        document.getElementById(
            "adminAverageSale"
        );


    if (totalRecordsElement) {

        totalRecordsElement.textContent =
            totalRecords.toLocaleString();

    }


    if (totalSalesElement) {

        totalSalesElement.textContent =
            formatCurrency(
                totalSales
            );

    }


    if (averageSaleElement) {

        averageSaleElement.textContent =
            formatCurrency(
                averageSale
            );

    }

}


// ============================================================
// RECORD COUNT
// ============================================================

function updateRecordCount() {

    const countElement =
        document.getElementById(
            "recordCount"
        );


    if (!countElement) {

        return;

    }


    const total =
        filteredData.length;


    const start =
        total === 0
            ? 0
            : (
                (
                    currentPage - 1
                ) *
                rowsPerPage
            ) + 1;


    const end =
        Math.min(
            currentPage *
            rowsPerPage,
            total
        );


    countElement.textContent =
        `Showing ${start}-${end} of ${total} records`;

}


// ============================================================
// PAGINATION
// ============================================================

function updatePagination() {

    const pagination =
        document.getElementById(
            "pagination"
        );


    if (!pagination) {

        return;

    }


    pagination.innerHTML = "";


    const totalPages =
        Math.ceil(
            filteredData.length /
            rowsPerPage
        );


    if (
        totalPages <= 1
    ) {

        return;

    }


    // --------------------------------------------------------
    // Previous
    // --------------------------------------------------------

    const previousButton =
        document.createElement(
            "button"
        );


    previousButton.textContent =
        "‹ Previous";


    previousButton.disabled =
        currentPage === 1;


    previousButton.onclick =
        function () {

            if (
                currentPage > 1
            ) {

                currentPage--;

                displaySales();

            }

        };


    pagination.appendChild(
        previousButton
    );


    // --------------------------------------------------------
    // Page numbers
    // --------------------------------------------------------

    const maxVisiblePages = 7;


    let startPage =
        Math.max(
            1,
            currentPage -
            Math.floor(
                maxVisiblePages / 2
            )
        );


    let endPage =
        Math.min(
            totalPages,
            startPage +
            maxVisiblePages -
            1
        );


    if (
        endPage - startPage <
        maxVisiblePages - 1
    ) {

        startPage =
            Math.max(
                1,
                endPage -
                maxVisiblePages +
                1
            );

    }


    // First page

    if (
        startPage > 1
    ) {

        createPageButton(
            1,
            pagination
        );


        if (
            startPage > 2
        ) {

            const dots =
                document.createElement(
                    "span"
                );


            dots.className =
                "pagination-dots";


            dots.textContent =
                "...";


            pagination.appendChild(
                dots
            );

        }

    }


    // Main page numbers

    for (
        let page = startPage;
        page <= endPage;
        page++
    ) {

        createPageButton(
            page,
            pagination
        );

    }


    // Last page

    if (
        endPage < totalPages
    ) {

        if (
            endPage <
            totalPages - 1
        ) {

            const dots =
                document.createElement(
                    "span"
                );


            dots.className =
                "pagination-dots";


            dots.textContent =
                "...";


            pagination.appendChild(
                dots
            );

        }


        createPageButton(
            totalPages,
            pagination
        );

    }


    // --------------------------------------------------------
    // Next
    // --------------------------------------------------------

    const nextButton =
        document.createElement(
            "button"
        );


    nextButton.textContent =
        "Next ›";


    nextButton.disabled =
        currentPage === totalPages;


    nextButton.onclick =
        function () {

            if (
                currentPage <
                totalPages
            ) {

                currentPage++;

                displaySales();

            }

        };


    pagination.appendChild(
        nextButton
    );

}


// ============================================================
// CREATE PAGE BUTTON
// ============================================================

function createPageButton(
    page,
    container
) {

    const button =
        document.createElement(
            "button"
        );


    button.textContent =
        page;


    if (
        page === currentPage
    ) {

        button.classList.add(
            "active-page"
        );

    }


    button.onclick =
        function () {

            currentPage =
                page;


            displaySales();

        };


    container.appendChild(
        button
    );

}


// ============================================================
// SEARCH
// ============================================================

function setupSearch() {

    const searchInput =
        document.getElementById(
            "adminSearch"
        );


    if (!searchInput) {

        return;

    }


    searchInput.addEventListener(
        "input",
        function () {

            const searchValue =
                this.value
                    .toLowerCase()
                    .trim();


            filteredData =
                salesData.filter(
                    item => {

                        return Object
                            .values(item)
                            .join(" ")
                            .toLowerCase()
                            .includes(
                                searchValue
                            );

                    }
                );


            currentPage = 1;


            displaySales();

        }
    );

}


// ============================================================
// ADD SALE
// ============================================================

function openAddModal() {

    const modal =
        document.getElementById(
            "saleModal"
        );


    const form =
        document.getElementById(
            "saleForm"
        );


    form.reset();


    document.getElementById(
        "editIndex"
    ).value = "";


    document.getElementById(
        "modalTitle"
    ).textContent =
        "Add Sale";


    modal.style.display =
        "flex";


    document.getElementById(
        "productId"
    ).focus();

}


// ============================================================
// CLOSE MODAL
// ============================================================

function closeModal() {

    const modal =
        document.getElementById(
            "saleModal"
        );


    modal.style.display =
        "none";

}


// ============================================================
// SAVE SALE
// ============================================================

function saveSale(event) {

    event.preventDefault();


    const editIndex =
        document.getElementById(
            "editIndex"
        ).value;


    const region =
        document.getElementById(
            "region"
        ).value;


    const salesRep =
        document.getElementById(
            "salesRep"
        ).value.trim();


    const sale = {

        Product_ID:
            document.getElementById(
                "productId"
            ).value.trim(),


        Sale_Date:
            formatDateForCSV(
                document.getElementById(
                    "saleDate"
                ).value
            ),


        Sales_Rep:
            salesRep,


        Region:
            region,


        Sales_Amount:
            document.getElementById(
                "salesAmount"
            ).value,


        Quantity_Sold:
            document.getElementById(
                "quantitySold"
            ).value,


        Product_Category:
            document.getElementById(
                "productCategory"
            ).value,


        Unit_Cost:
            document.getElementById(
                "unitCost"
            ).value,


        Unit_Price:
            document.getElementById(
                "unitPrice"
            ).value,


        Customer_Type:
            document.getElementById(
                "customerType"
            ).value,


        Discount:
            document.getElementById(
                "discount"
            ).value,


        Payment_Method:
            document.getElementById(
                "paymentMethod"
            ).value,


        Sales_Channel:
            document.getElementById(
                "salesChannel"
            ).value,


        Region_and_Sales_Rep:
            `${region}-${salesRep}`

    };


    // --------------------------------------------------------
    // EDIT
    // --------------------------------------------------------

    if (
        editIndex !== ""
    ) {

        salesData[
            parseInt(editIndex)
        ] = sale;

    }


    // --------------------------------------------------------
    // ADD
    // --------------------------------------------------------

    else {

        salesData.push(
            sale
        );

    }


    saveToLocalStorage();


    filteredData =
        [...salesData];


    currentPage =
        Math.ceil(
            filteredData.length /
            rowsPerPage
        );


    displaySales();


    updateStatistics();


    closeModal();


    alert(
        editIndex !== ""
            ? "Sale updated successfully!"
            : "Sale added successfully!"
    );

}


// ============================================================
// EDIT SALE
// ============================================================

function editSale(index) {

    const sale =
        salesData[index];


    if (!sale) {

        return;

    }


    document.getElementById(
        "editIndex"
    ).value = index;


    document.getElementById(
        "productId"
    ).value =
        sale.Product_ID || "";


    document.getElementById(
        "saleDate"
    ).value =
        convertDateForInput(
            sale.Sale_Date
        );


    document.getElementById(
        "salesRep"
    ).value =
        sale.Sales_Rep || "";


    document.getElementById(
        "region"
    ).value =
        sale.Region || "";


    document.getElementById(
        "salesAmount"
    ).value =
        sale.Sales_Amount || "";


    document.getElementById(
        "quantitySold"
    ).value =
        sale.Quantity_Sold || "";


    document.getElementById(
        "productCategory"
    ).value =
        sale.Product_Category || "";


    document.getElementById(
        "unitCost"
    ).value =
        sale.Unit_Cost || "";


    document.getElementById(
        "unitPrice"
    ).value =
        sale.Unit_Price || "";


    document.getElementById(
        "customerType"
    ).value =
        sale.Customer_Type || "";


    document.getElementById(
        "discount"
    ).value =
        sale.Discount || "";


    document.getElementById(
        "paymentMethod"
    ).value =
        sale.Payment_Method || "";


    document.getElementById(
        "salesChannel"
    ).value =
        sale.Sales_Channel || "";


    document.getElementById(
        "modalTitle"
    ).textContent =
        "Edit Sale";


    document.getElementById(
        "saleModal"
    ).style.display =
        "flex";

}


// ============================================================
// DELETE SALE
// ============================================================

function deleteSale(index) {

    const sale =
        salesData[index];


    if (!sale) {

        return;

    }


    const confirmed =
        confirm(
            `Are you sure you want to delete Product ID ${sale.Product_ID}?`
        );


    if (!confirmed) {

        return;

    }


    salesData.splice(
        index,
        1
    );


    saveToLocalStorage();


    filteredData =
        [...salesData];


    const totalPages =
        Math.max(
            1,
            Math.ceil(
                filteredData.length /
                rowsPerPage
            )
        );


    if (
        currentPage >
        totalPages
    ) {

        currentPage =
            totalPages;

    }


    displaySales();


    updateStatistics();


    alert(
        "Sale deleted successfully!"
    );

}


// ============================================================
// EXPORT CSV
// ============================================================

function exportCSV() {

    if (
        salesData.length === 0
    ) {

        alert(
            "No data available to export."
        );

        return;

    }


    const headers = [

        "Product_ID",
        "Sale_Date",
        "Sales_Rep",
        "Region",
        "Sales_Amount",
        "Quantity_Sold",
        "Product_Category",
        "Unit_Cost",
        "Unit_Price",
        "Customer_Type",
        "Discount",
        "Payment_Method",
        "Sales_Channel",
        "Region_and_Sales_Rep"

    ];


    const csvRows = [];


    csvRows.push(
        headers.join(",")
    );


    salesData.forEach(
        item => {

            const row =
                headers.map(
                    header =>
                        csvEscape(
                            item[header]
                        )
                );


            csvRows.push(
                row.join(",")
            );

        }
    );


    const blob =
        new Blob(
            [
                "\ufeff" +
                csvRows.join("\n")
            ],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href = url;


    link.download =
        `sales_data_updated_${getDateStamp()}.csv`;


    document.body.appendChild(
        link
    );


    link.click();


    document.body.removeChild(
        link
    );


    URL.revokeObjectURL(
        url
    );

}


// ============================================================
// IMPORT CSV
// ============================================================

function importCSV(event) {

    const file =
        event.target.files[0];


    if (!file) {

        return;

    }


    const reader =
        new FileReader();


    reader.onload =
        function (e) {

            try {

                const csvText =
                    e.target.result;


                const importedData =
                    parseCSV(
                        csvText
                    );


                if (
                    importedData.length === 0
                ) {

                    alert(
                        "The CSV file is empty."
                    );

                    return;

                }


                const confirmed =
                    confirm(
                        `Import ${importedData.length} records?\n\n` +
                        "This will replace the current data."
                    );


                if (!confirmed) {

                    return;

                }


                salesData =
                    importedData;


                saveToLocalStorage();


                filteredData =
                    [...salesData];


                currentPage = 1;


                displaySales();


                updateStatistics();


                alert(
                    "CSV imported successfully!"
                );

            }

            catch (error) {

                console.error(
                    error
                );


                alert(
                    "Unable to import CSV."
                );

            }

        };


    reader.readAsText(
        file
    );


    event.target.value = "";

}


// ============================================================
// DATE FORMAT FOR CSV
// ============================================================

function formatDateForCSV(
    dateValue
) {

    if (!dateValue) {

        return "";

    }


    const parts =
        dateValue.split("-");


    if (
        parts.length !== 3
    ) {

        return dateValue;

    }


    return `${parts[2]}/${parts[1]}/${parts[0]}`;

}


// ============================================================
// DATE FORMAT FOR INPUT
// ============================================================

function convertDateForInput(
    dateValue
) {

    if (!dateValue) {

        return "";

    }


    const parts =
        dateValue.split("/");


    if (
        parts.length !== 3
    ) {

        return dateValue;

    }


    return `${parts[2]}-${parts[1]}-${parts[0]}`;

}


// ============================================================
// NUMBER
// ============================================================

function parseNumber(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return 0;

    }


    const number =
        parseFloat(
            String(value).replace(
                /[^0-9.-]/g,
                ""
            )
        );


    return isNaN(number)
        ? 0
        : number;

}


// ============================================================
// CURRENCY
// ============================================================

function formatCurrency(value) {

    const number =
        parseNumber(value);


    return "$" +
        number.toLocaleString(
            "en-US",
            {
                minimumFractionDigits: 2,

                maximumFractionDigits: 2
            }
        );

}


// ============================================================
// CSV ESCAPE
// ============================================================

function csvEscape(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    const text =
        String(value);


    if (
        text.includes(",") ||
        text.includes('"') ||
        text.includes("\n")
    ) {

        return `"${text.replace(
            /"/g,
            '""'
        )}"`;

    }


    return text;

}


// ============================================================
// HTML ESCAPE
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
// DATE STAMP
// ============================================================

function getDateStamp() {

    const now =
        new Date();


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            now.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}


// ============================================================
// CLOSE MODAL WHEN CLICKING OUTSIDE
// ============================================================

window.addEventListener(
    "click",
    function(event) {

        const modal =
            document.getElementById(
                "saleModal"
            );


        if (
            event.target === modal
        ) {

            closeModal();

        }

    }
);


// ============================================================
// ESCAPE KEY CLOSES MODAL
// ============================================================

window.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Escape"
        ) {

            closeModal();

        }

    }
);


// ============================================================
// SYNC DATA FROM ANOTHER TAB
// ============================================================

window.addEventListener(
    "storage",
    function(event) {

        if (
            event.key !== STORAGE_KEY
        ) {

            return;

        }


        try {

            salesData =
                JSON.parse(
                    event.newValue ||
                    "[]"
                );


            filteredData =
                [...salesData];


            currentPage = 1;


            displaySales();


            updateStatistics();


            console.log(
                "Admin panel synchronized."
            );

        }

        catch (error) {

            console.error(
                "Storage synchronization error:",
                error
            );

        }

    }
);