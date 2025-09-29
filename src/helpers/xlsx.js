import ExcelJS from 'exceljs'
import i18n from '@/locales/i18n'
import {useProductStore} from "@/stores/product.js";
import {formatCurrency} from "@/helpers/numberFormat.js";

export const exportInventory = async (products, kits, location, dateFrom, dateTo) => {
    // Создаем новую книгу и лист
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(i18n.global.t('cards.inventory'))
    let skipRowCount = 3

    setupPage(worksheet, 'landscape')

    // Добавляем заголовки
    worksheet.columns = [
        { width: 6 }, // 1 id
        { width: 14 }, // 2 name
        { width: 14 }, // 3 code
        { width: 14 }, // 4 color
        { width: 14 }, // 5 expiryDate
        { width: 14 }, // 6 begin
        { width: 14 }, // 7 income
        { width: 14 }, // 8 expense
        { width: 14 }, // 9 writeOff
        { width: 14 }, // 10 current
        { width: 14 }, // 11 fact
        { width: 14 }, // 12 costPrice
        { width: 14 }, // 13 currentSum
        { width: 14 }, // 14 factSum
        { width: 14 }, // 15 unitDiff
        { width: 14 }, // 16 diff
        { width: 14 }, // 17 inComposition
        { width: 14 }, // 18 factTotal
    ]

    const title = [
        [i18n.global.t('labels.location'), location.name],
        [i18n.global.t('labels.dateFrom'), formatDate(dateFrom)],
        [i18n.global.t('labels.dateTo'), formatDate(dateTo)],
    ]

    title.forEach((row, index) => {
        const rowIndex = index + 1 // Excel нумерация начинается с 1

        const aCell = worksheet.getCell(`A${rowIndex}`)
        const cCell = worksheet.getCell(`C${rowIndex}`)

        worksheet.mergeCells(`A${rowIndex}:B${rowIndex}`)
        aCell.value = row[0]
        cCell.value = row[1]

        textFormat(aCell, 'Tahoma', true, 11, '000000')
        textFormat(cCell, 'Tahoma', false, 11, '000000')
    })

    // Products START
    if (products.length) {
        worksheet.addRow([])
        skipRowCount += 2

        const header = [
            i18n.global.t('labels.id'),
            i18n.global.t('labels.product'),
            i18n.global.t('labels.code'),
            i18n.global.t('labels.color'),
            i18n.global.t('labels.expiryDate'),
            i18n.global.t('labels.initial'),
            i18n.global.t('labels.income'),
            i18n.global.t('labels.expense'),
            i18n.global.t('cards.writeOffInvoices'),
            i18n.global.t('labels.currentQty'),
            i18n.global.t('labels.factQty'),
            i18n.global.t('labels.costPrice'),
            i18n.global.t('labels.currentPrice'),
            i18n.global.t('labels.factPrice'),
            i18n.global.t('labels.differenceUnit'),
            i18n.global.t('labels.difference'),
            i18n.global.t('labels.forTheKit'),
            i18n.global.t('labels.totalFact'),
        ]

        const headerRow = worksheet.addRow(header)

        // Форматирование заголовка таблицы
        headerRow.eachCell((cell) => {
            addBorder(cell)
            fillFormat(cell, 'eaecef')
            textFormat(cell, 'Tahoma', true, 10, '000000')
            textAlignment(cell, 'center', 'middle', false)
        })

        // Пример данных для таблицы
        const productTableData = products.map((item, index) => [
            item.id,
            item.locationQuantity?.product.name,
            item.locationQuantity?.product.code,
            item.locationQuantity?.color ? item.locationQuantity.color.name : '-',
            item.locationQuantity?.expiryDate ? formatDate(item.locationQuantity.expiryDate) : '-',
            item.initialQty,
            item.incomeQty,
            item.expenseQty,
            item.writeOffQty,
            item.currentQty,
            +item.factQty,
            item.costPrice,
            '', // costPrice * currentQty
            '', // costPrice * factQty
            '', // factQty - currentQty
            '', // (costPrice * factQty) - (costPrice * currentQty)
            item.kitProductQty,
            '', // factQty + kitProductQty
        ])

        // Добавление данных в таблицу
        productTableData.forEach((rowData) => {
            const row = worksheet.addRow(rowData)
            const rowIndex = row.number // Номер текущей строки

            row.getCell(13).value = {
                formula: `J${rowIndex}*L${rowIndex}`
            }

            row.getCell(14).value = {
                formula: `K${rowIndex}*L${rowIndex}`
            }

            row.getCell(15).value = {
                formula: `K${rowIndex}-J${rowIndex}`
            }

            row.getCell(16).value = {
                formula: `(L${rowIndex}*K${rowIndex})-(L${rowIndex}*J${rowIndex})`
            }

            row.getCell(18).value = {
                formula: `K${rowIndex}+Q${rowIndex}`
            }

            row.eachCell((cell, colNumber) => {
                addBorder(cell)
                textFormat(cell, 'Tahoma', false, 11, '000000')

                if ([1, 5].includes(colNumber)) {
                    textAlignment(cell, 'center', 'middle', false)
                } else if ([2, 3, 4].includes(colNumber)) {
                    textAlignment(cell, 'left', 'middle', false)
                } else if ([6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].includes(colNumber)) {
                    textAlignment(cell, 'right', 'middle', false)
                    formatNumber(cell)
                }
            })
        })

        // Реализовываем футер
        const productsRowNumber = products.length + skipRowCount + 1
        const productsFooterRow = worksheet.getRow(productsRowNumber)

        // footerTitle
        const titleCell = productsFooterRow.getCell(12)
        titleCell.value = i18n.global.t('labels.totals')

        // currentSumCell
        const currentSumCell = productsFooterRow.getCell(13)
        currentSumCell.value = { formula: `SUM(M${productsRowNumber - products.length}:M${productsRowNumber - 1})` }
        formatNumber(currentSumCell)

        // factSumCell
        const factSumCell = productsFooterRow.getCell(14)
        factSumCell.value = { formula: `SUM(N${productsRowNumber - products.length}:N${productsRowNumber - 1})` }
        formatNumber(factSumCell)

        // unitDiffCell
        const unitDiffCell = productsFooterRow.getCell(15)
        unitDiffCell.value = { formula: `SUM(O${productsRowNumber - products.length}:O${productsRowNumber - 1})` }
        formatNumber(unitDiffCell)

        // diffCell
        const diffCell = productsFooterRow.getCell(16)
        diffCell.value = { formula: `SUM(P${productsRowNumber - products.length}:P${productsRowNumber - 1})` }
        formatNumber(diffCell)

        // inCompositionCell
        const inCompositionCell = productsFooterRow.getCell(17)
        inCompositionCell.value = { formula: `SUM(Q${productsRowNumber - products.length}:Q${productsRowNumber - 1})` }
        formatNumber(inCompositionCell)

        // totalFactCell
        const totalFactCell = productsFooterRow.getCell(18)
        totalFactCell.value = { formula: `SUM(R${productsRowNumber - products.length}:R${productsRowNumber - 1})` }
        formatNumber(totalFactCell)

        for (let colNumber = 1; colNumber <= 18; colNumber++) {
            const cell = productsFooterRow.getCell(colNumber)
            fillFormat(cell, 'e6e9ec')
            addBorder(cell)
            textAlignment(cell, 'right', 'middle', false)

            if (colNumber === 12) {
                textFormat(cell, 'Tahoma', true, 10, '000000')
            } else if (colNumber > 12) {
                textFormat(cell, 'Tahoma', false, 11, '000000')
                formatNumber(cell)
            }
        }

        skipRowCount += 1
    }
    // Products END

    // Kits START
    if (kits.length) {
        worksheet.addRow([])
        skipRowCount += 2

        const header = [
            i18n.global.t('labels.id'),
            i18n.global.t('labels.kit'),
            i18n.global.t('labels.code'),
            i18n.global.t('labels.expiryDate'),
            i18n.global.t('labels.initial'),
            i18n.global.t('labels.income'),
            i18n.global.t('labels.expense'),
            i18n.global.t('cards.writeOffInvoices'),
            i18n.global.t('labels.currentQty'),
            i18n.global.t('labels.factQty'),
            i18n.global.t('labels.costPrice'),
            i18n.global.t('labels.currentPrice'),
            i18n.global.t('labels.factPrice'),
            i18n.global.t('labels.differenceUnit'),
            i18n.global.t('labels.difference'),
        ]

        const headerRow = worksheet.addRow(header)

        // Форматирование заголовка таблицы
        headerRow.eachCell((cell) => {
            addBorder(cell)
            fillFormat(cell, 'eaecef')
            textFormat(cell, 'Tahoma', true, 10, '000000')
            textAlignment(cell, 'center', 'middle', false)
        })

        // Пример данных для таблицы
        const kitTableData = kits.map((item, index) => [
            item.id,
            item.locationQuantityKit?.kit.name,
            item.locationQuantityKit?.kit.code,
            item.locationQuantityKit?.expiryDate ? formatDate(item.locationQuantityKit?.expiryDate) : '-',
            item.initialQty,
            item.incomeQty,
            item.expenseQty,
            item.writeOffQty,
            item.currentQty,
            +item.factQty,
            item.costPrice,
            '', // costPrice * currentQty
            '', // costPrice * factQty
            '', // factQty - currentQty
            '', // (costPrice * factQty) - (costPrice * currentQty)
        ])

        // Добавление данных в таблицу
        kitTableData.forEach((rowData) => {
            const row = worksheet.addRow(rowData)
            const rowIndex = row.number // Номер текущей строки

            row.getCell(12).value = {
                formula: `I${rowIndex}*K${rowIndex}`
            }

            row.getCell(13).value = {
                formula: `J${rowIndex}*K${rowIndex}`
            }

            row.getCell(14).value = {
                formula: `J${rowIndex}-I${rowIndex}`
            }

            row.getCell(15).value = {
                formula: `(K${rowIndex}*J${rowIndex})-(K${rowIndex}*I${rowIndex})`
            }

            row.eachCell((cell, colNumber) => {
                addBorder(cell)
                textFormat(cell, 'Tahoma', false, 11, '000000')

                if ([1, 4].includes(colNumber)) {
                    textAlignment(cell, 'center', 'middle', false)
                } else if ([2, 3].includes(colNumber)) {
                    textAlignment(cell, 'left', 'middle', false)
                } else if ([6, 7, 8, 9, 10, 11, 12, 13, 14, 15].includes(colNumber)) {
                    textAlignment(cell, 'right', 'middle', false)
                    formatNumber(cell)
                }
            })
        })

        // Реализовываем футер
        const kitsRowNumber = products.length + kits.length + skipRowCount + 1
        const kitsFooterRow = worksheet.getRow(kitsRowNumber)

        // footerTitle
        const titleCell = kitsFooterRow.getCell(11)
        titleCell.value = i18n.global.t('labels.totals')

        // currentSumCell
        const currentSumCell = kitsFooterRow.getCell(12)
        currentSumCell.value = { formula: `SUM(L${kitsRowNumber - kits.length}:L${kitsRowNumber - 1})` }
        formatNumber(currentSumCell)

        // factSumCell
        const factSumCell = kitsFooterRow.getCell(13)
        factSumCell.value = { formula: `SUM(M${kitsRowNumber - kits.length}:M${kitsRowNumber - 1})` }
        formatNumber(factSumCell)

        // unitDiffCell
        const unitDiffCell = kitsFooterRow.getCell(14)
        unitDiffCell.value = { formula: `SUM(N${kitsRowNumber - kits.length}:N${kitsRowNumber - 1})` }
        formatNumber(unitDiffCell)

        // diffCell
        const diffCell = kitsFooterRow.getCell(15)
        diffCell.value = { formula: `SUM(O${kitsRowNumber - kits.length}:O${kitsRowNumber - 1})` }
        formatNumber(diffCell)

        for (let colNumber = 1; colNumber <= 15; colNumber++) {
            const cell = kitsFooterRow.getCell(colNumber)
            fillFormat(cell, 'e6e9ec')
            addBorder(cell)
            textAlignment(cell, 'right', 'middle', false)

            if (colNumber === 11) {
                textFormat(cell, 'Tahoma', true, 10, '000000')
            } else if (colNumber > 11) {
                textFormat(cell, 'Tahoma', false, 11, '000000')
                formatNumber(cell)
            }
        }
    }
    // Kits END

    // ******************************************************************************** //

    // Генерация файла
    const buffer = await workbook.xlsx.writeBuffer()

    // Создание и скачивание файла
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)

    const timestamp = formatDateForFilename()
    link.download = `${i18n.global.t('cards.inventory')}_${timestamp}.xlsx`
    link.click()
}

export const exportSellersKpi = async (sellersKpi) => {
    // Создаем новую книгу и лист
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(i18n.global.t('cards.sellerKpi'))

    setupPage(worksheet, 'portrait')

    // Добавляем заголовки
    worksheet.columns = [
        { width: 6 }, // 1 id
        { width: 30 }, // 2 seller
        { width: 18 }, // 3 location
        { width: 14 }, // 4 month
        { width: 14 }, // 5 inComposition
        { width: 12 }, // 6 forOrder
        { width: 12 }, // 7 forCategory
        { width: 14 }, // 8 total
    ]

    const header = [
        i18n.global.t('labels.id'),
        i18n.global.t('roles.seller'),
        i18n.global.t('labels.locations'),
        i18n.global.t('labels.month'),
        i18n.global.t('labels.forTheKit'),
        i18n.global.t('labels.forTheOrder'),
        i18n.global.t('labels.forTheCategory'),
        i18n.global.t('labels.total'),
    ]

    const headerRow = worksheet.addRow(header)
    headerRow.height = 30

    // Форматирование заголовка таблицы
    headerRow.eachCell((cell) => {
        addBorder(cell)
        fillFormat(cell, 'eaecef')
        textFormat(cell, 'Tahoma', true, 10, '000000')
        textAlignment(cell, 'center', 'middle', true)
    })

    // Пример данных для таблицы
    const tableData = sellersKpi.map((item, index) => [
        item.id,
        item.seller,
        item.location,
        i18n.global.t(item.month),
        item.kitsKpi,
        item.orderInvoicesKpi,
        item.categoriesKpi,
        '',
    ])

    // Добавление данных в таблицу
    tableData.forEach((rowData) => {
        const row = worksheet.addRow(rowData)
        const rowIndex = row.number // Номер текущей строки

        row.getCell(8).value = {
            formula: `E${rowIndex}+F${rowIndex}+G${rowIndex}`
        }

        row.eachCell((cell, colNumber) => {
            addBorder(cell)
            textFormat(cell, 'Tahoma', false, 11, '000000')

            if ([1].includes(colNumber)) {
                textAlignment(cell, 'center', 'middle', false)
            } else if ([2, 3, 4].includes(colNumber)) {
                textAlignment(cell, 'left', 'middle', false)
            } else if ([5, 6, 7, 8].includes(colNumber)) {
                textAlignment(cell, 'right', 'middle', false)
                formatNumber(cell)
            }
        })
    })

    // ******************************************************************************** //

    // Генерация файла
    const buffer = await workbook.xlsx.writeBuffer()

    // Создание и скачивание файла
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)

    const timestamp = formatDateForFilename()
    link.download = `${i18n.global.t('cards.sellerKpi')}_${timestamp}.xlsx`
    link.click()
}

export const exportAbcAnalysis = async () => {
    // Создаем новую книгу и лист
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(i18n.global.t('cards.abc'))
    const productStore = useProductStore()

    setupPage(worksheet, 'portrait')

    // Добавляем заголовки
    worksheet.columns = [
        { width: 6 }, // 1 id
        { width: 30 }, // 2 product
        { width: 18 }, // 3 sales unit
        { width: 14 }, // 4 income $
        { width: 14 }, // 5 profit $
        { width: 12 }, // 6 sales %
        { width: 12 }, // 7 income %
        { width: 14 }, // 8 profit %
    ]

    const header = [
        '№',
        i18n.global.t('labels.product'),
        i18n.global.t('labels.sales'),
        i18n.global.t('labels.revenue'),
        i18n.global.t('labels.benefit'),
        `${i18n.global.t('labels.sales')} %`,
        `${i18n.global.t('labels.revenue')} %`,
        `${i18n.global.t('labels.benefit')} %`,
    ]

    const headerRow = worksheet.addRow(header)

    // Форматирование заголовка таблицы
    headerRow.eachCell((cell) => {
        addBorder(cell)
        fillFormat(cell, 'eaecef')
        textFormat(cell, 'Tahoma', true, 10, '000000')
        textAlignment(cell, 'center', 'middle', false)
    })

    // Пример данных для таблицы
    const tableData = productStore.getABCProducts.models.map((item, index) => [
        index + 1,
        item.name,
        `${formatCurrency(item.ordersQty)} ${i18n.global.t(`labels.${item.unit}`)}`,
        `${formatCurrency(item.ordersPrice)} $`,
        `${formatCurrency(item.benefit)} $`,
        `${item.qtyCategory} ${item.ordersQtyPercent.toFixed(2)}`,
        `${item.priceCategory} ${item.ordersPricePercent.toFixed(2)}`,
        `${item.benefitCategory} ${item.benefitPercent.toFixed(2)}`,

    ])

    // Добавление данных в таблицу
    tableData.forEach((rowData) => {
        const row = worksheet.addRow(rowData)

        row.eachCell((cell, colNumber) => {
            addBorder(cell)
            textFormat(cell, 'Tahoma', false, 11, '000000')

            if ([1, 6, 7, 8].includes(colNumber)) {
                textAlignment(cell, 'center', 'middle', false)

                if ([6, 7, 8].includes(colNumber)) {
                    if (cell.value.startsWith('A')) {
                        textFormat(cell, 'Tahoma', false, 11, '16a34a')
                    } else if (cell.value.startsWith('B')) {
                        textFormat(cell, 'Tahoma', false, 11, 'facc15')
                    } else if (cell.value.startsWith('C')) {
                        textFormat(cell, 'Tahoma', false, 11, 'dc2626')
                    }
                }
            } else if ([2, 3, 4, 5].includes(colNumber)) {
                textAlignment(cell, 'left', 'middle', false)
            }
        })
    })

    // ******************************************************************************** //

    // Генерация файла
    const buffer = await workbook.xlsx.writeBuffer()

    // Создание и скачивание файла
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)

    const timestamp = formatDateForFilename()
    link.download = `${i18n.global.t('cards.abc')}_${timestamp}.xlsx`
    link.click()
}

function addBorder(cell) {
    cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
    }
}

function textAlignment(cell, horizontal = 'center', vertical = 'middle', wrapText = false) {
    cell.alignment = {
        horizontal,
        vertical,
        wrapText,
    }
}

function textFormat(cell, name = 'Tahoma', bold = false, size = 12, color = '000000') {
    cell.font = {
        name,
        bold,
        size,
        color: { argb: color.toUpperCase() } // Приводим цвет к верхнему регистру
    }
}

function fillFormat(cell, color) {
    cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: color },
    }
}

function formatNumber(cell) {
    const localCell = cell

    if (Number.isInteger(localCell.value)) {
        localCell.numFmt = '#,##0'; // Формат для целых чисел
    } else {
        localCell.numFmt = '#,##0.##'; // Формат для дробных чисел
    }
}

function formatWeight(cell) {
    const localCell = cell

    if (Number.isInteger(localCell.value)) {
        localCell.numFmt = '#,##0'; // Формат для целых чисел
    } else {
        localCell.numFmt = '#,##0.###'; // Формат для дробных чисел
    }
}

function setupPage(worksheet, orientation) {
    worksheet.pageSetup = {
        paperSize: 9, // A4
        orientation,
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 1000,
        margins: {
            left: 0.3, right: 0.3, top: 0.3, bottom: 0.3, header: 0.3, footer: 0.3
        },
    }
}

const formatDateForFilename = () => {
    const now = new Date();
    const pad = (num) => String(num).padStart(2, '0');

    const day = pad(now.getDate());
    const month = pad(now.getMonth() + 1);
    const year = now.getFullYear();

    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());

    return `${day}${month}${year}_${hours}${minutes}${seconds}`;
};

function formatDate(inputFormat) {
    function pad(s) {
        return (s < 10) ? '0' + s : s;
    }

    let d = new Date(inputFormat)
    return [pad(d.getDate()), pad(d.getMonth() + 1), d.getFullYear()].join('.')
}