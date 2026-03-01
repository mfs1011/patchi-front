import ExcelJS from 'exceljs'
import i18n from '@/locales/i18n'
import {useProductStore} from "@/stores/product.js";
import {formatCurrency, getFormattedDate} from "@/helpers/numberFormat.js";
import {useLocationQuantityStore} from "@/stores/locationQuantity.js";
import {useLocationQuantityKitStore} from "@/stores/locationQuantityKit.js";

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

        formatHeader(worksheet, header, 30)

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

        formatHeader(worksheet, header, 30)

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

    formatHeader(worksheet, header, 30)

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

    formatHeader(worksheet, header)

    // Пример данных для таблицы
    const tableData = productStore.getABCProducts.models.map((item, index) => [
        index + 1,
        item.code,
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

export const exportIncomeInvoice = async (data, supplier, location, date, comment) => {
    // Создаем новую книгу и лист
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(i18n.global.t('cards.incomeInvoice'))

    setupPage(worksheet, 'portrait')

    // Добавляем заголовки
    worksheet.columns = [
        { width: 6 }, // 1 index
        { width: 24 }, // 2 product
        { width: 12 }, // 3 color
        { width: 14 }, // 4 expiryDate
        { width: 12 }, // 5 qty
        { width: 12 }, // 6 price
        { width: 16 }, // 7 logistics
        { width: 16 }, // 8 customsFee
    ]

    const title = [
        [i18n.global.t('supplier.nominativeCapitalize'), supplier.name],
        [i18n.global.t('labels.Location'), location.name],
        [i18n.global.t('labels.createdAt'), formatDate(date)],
        [i18n.global.t('labels.comment'), comment],
        [],
    ]

    title.forEach((row, index) => {
        const rowIndex = index + 1 // Excel нумерация начинается с 1

        const aCell = worksheet.getCell(`A${rowIndex}`)
        const cCell = worksheet.getCell(`C${rowIndex}`)

        worksheet.mergeCells(`A${rowIndex}:B${rowIndex}`)
        worksheet.mergeCells(`C${rowIndex}:E${rowIndex}`)
        aCell.value = row[0]
        cCell.value = row[1]

        textFormat(aCell, 'Tahoma', true, 11, '000000')
        textFormat(cCell, 'Tahoma', false, 11, '000000')
    })

    const header = [
        '№',
        i18n.global.t('labels.product'),
        i18n.global.t('labels.color'),
        i18n.global.t('labels.expiryDate'),
        i18n.global.t('labels.qty'),
        i18n.global.t('labels.price'),
        i18n.global.t('labels.transportationFee'),
        i18n.global.t('labels.customsFee'),
    ]

    formatHeader(worksheet, header, 30)

    // Пример данных для таблицы
    const tableData = data.map((item, index) => [
        index + 1,
        item.product?.name,
        item.color?.name || '-',
        item.expiryDate ? formatDate(item.expiryDate) : '-',
        item.qty,
        item.price,
        item.transportationFee,
        item.customsFee,
    ])

    // Добавление данных в таблицу
    tableData.forEach((rowData) => {
        const row = worksheet.addRow(rowData)

        row.eachCell((cell, colNumber) => {
            addBorder(cell)
            textFormat(cell, 'Tahoma', false, 11, '000000')

            if ([1, 4].includes(colNumber)) {
                textAlignment(cell, 'center', 'middle', false)
            } else if ([2, 3].includes(colNumber)) {
                textAlignment(cell, 'left', 'middle', false)
            } else if ([5, 6, 7, 8].includes(colNumber)) {
                textAlignment(cell, 'right', 'middle', false)
            }
        })
    })

    // Реализовываем футер
    const rowNumber = data.length + 7
    const footerRow = worksheet.getRow(rowNumber)

    // footerTitle
    const titleCell = footerRow.getCell(7)
    titleCell.value = i18n.global.t('labels.totals')

    // totalsValueCell
    const totalsValueCell = footerRow.getCell(8)
    totalsValueCell.value = { formula: `SUM(F7:H${data.length + 6})` }
    formatNumber(totalsValueCell)

    for (let colNumber = 1; colNumber <= 8; colNumber++) {
        const cell = footerRow.getCell(colNumber)
        fillFormat(cell, 'e6e9ec')
        addBorder(cell)
        textAlignment(cell, 'right', 'middle', false)

        if (colNumber === 7) {
            textFormat(cell, 'Tahoma', true, 10, '000000')
        } else if (colNumber > 7) {
            textFormat(cell, 'Tahoma', false, 11, '000000')
            formatNumber(cell)
        }
    }

    // ******************************************************************************** //

    // Генерация файла
    const buffer = await workbook.xlsx.writeBuffer()

    // Создание и скачивание файла
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)

    const timestamp = formatDateForFilename()
    link.download = `${i18n.global.t('cards.incomeInvoice')}_${timestamp}.xlsx`
    link.click()
}

export const exportTransferInvoice = async (products, kits, fromLocation, toLocation) => {
    // Создаем новую книгу и лист
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(i18n.global.t('labels.TransferInvoice'))

    setupPage(worksheet, 'portrait')

    // Добавляем заголовки
    worksheet.columns = [
        { width: 6 }, // 1 index
        { width: 16 }, // 2 type
        { width: 32 }, // 3 name
        { width: 16 }, // 4 code
        { width: 14 }, // 5 color
        { width: 14 }, // 6 qr
        { width: 12 }, // 7 wholesalePrice
        { width: 12 }, // 9 qty
        { width: 14 }, // 8 expiryDate
    ]

    const title = [
        [i18n.global.t('labels.fromLocation'), fromLocation.name],
        [i18n.global.t('labels.toLocation'), toLocation.name],
        [],
    ]

    title.forEach((row, index) => {
        const rowIndex = index + 1 // Excel нумерация начинается с 1

        const aCell = worksheet.getCell(`A${rowIndex}`)
        const cCell = worksheet.getCell(`C${rowIndex}`)

        worksheet.mergeCells(`A${rowIndex}:B${rowIndex}`)
        worksheet.mergeCells(`C${rowIndex}:E${rowIndex}`)
        aCell.value = row[0]
        cCell.value = row[1]

        textFormat(aCell, 'Tahoma', true, 11, '000000')
        textFormat(cCell, 'Tahoma', false, 11, '000000')
    })

    const header = [
        '№',
        i18n.global.t('labels.type'),
        i18n.global.t('labels.title'),
        i18n.global.t('labels.code'),
        i18n.global.t('labels.color'),
        i18n.global.t('labels.qr'),
        i18n.global.t('labels.wholesalePrice'),
        i18n.global.t('labels.qty'),
        i18n.global.t('labels.expiryDate'),
    ]

    formatHeader(worksheet, header, 30)

    // Пример данных для таблицы
    const productTableData = products.map((item, index) => [
        index + 1,
        i18n.global.t('labels.Product'),
        item.locationQuantity?.product?.name,
        item.locationQuantity?.product?.code || '-',
        item.locationQuantity?.color?.name || '-',
        item.locationQuantity?.product?.qr || '-',
        item.locationQuantity?.product?.wholesalePrice,
        item.qty,
        item.locationQuantity?.expiryDate ? formatDate(item.locationQuantity?.expiryDate) : '-',
    ])

    const kitTableData = kits.map((item, index) => [
        productTableData.length + index + 1,
        i18n.global.t('labels.Kit'),
        item.locationQuantityKit?.kit?.name,
        item.locationQuantityKit?.kit?.code || '-',
        '-',
        item.locationQuantityKit?.kit?.qr || '-',
        item.locationQuantityKit?.kit?.wholesalePrice,
        item.qty,
        item.locationQuantityKit?.expiryDate ? formatDate(item.locationQuantityKit?.expiryDate) : '-',
    ])

    const tableData = [...productTableData, ...kitTableData]

        // Добавление данных в таблицу
    tableData.forEach((rowData) => {
        const row = worksheet.addRow(rowData)

        row.eachCell((cell, colNumber) => {
            addBorder(cell)
            textFormat(cell, 'Tahoma', false, 11, '000000')

            if ([1, 9].includes(colNumber)) {
                textAlignment(cell, 'center', 'middle', false)
            } else if ([2, 3, 4, 5, 6].includes(colNumber)) {
                textAlignment(cell, 'left', 'middle', false)
            } else if ([7, 8].includes(colNumber)) {
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
    link.download = `${i18n.global.t('labels.TransferInvoice')}_${timestamp}.xlsx`
    link.click()
}

export const exportReturnInvoice = async (products, kits, customer, location, date) => {
    // Создаем новую книгу и лист
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(i18n.global.t('labels.ReturnInvoice'))

    setupPage(worksheet, 'portrait')

    // Добавляем заголовки
    worksheet.columns = [
        { width: 6 }, // 1 index
        { width: 16 }, // 2 type
        { width: 32 }, // 3 name
        { width: 16 }, // 4 code
        { width: 14 }, // 5 color
        { width: 14 }, // 6 qr
        { width: 12 }, // 7 price
        { width: 12 }, // 9 qty
    ]

    const title = [
        [i18n.global.t('labels.client'), customer.name],
        [i18n.global.t('labels.location'), location.name],
        [i18n.global.t('labels.createdAt'), formatDate(date)],
        [],
    ]

    title.forEach((row, index) => {
        const rowIndex = index + 1 // Excel нумерация начинается с 1

        const aCell = worksheet.getCell(`A${rowIndex}`)
        const cCell = worksheet.getCell(`C${rowIndex}`)

        worksheet.mergeCells(`A${rowIndex}:B${rowIndex}`)
        worksheet.mergeCells(`C${rowIndex}:E${rowIndex}`)
        aCell.value = row[0]
        cCell.value = row[1]

        textFormat(aCell, 'Tahoma', true, 11, '000000')
        textFormat(cCell, 'Tahoma', false, 11, '000000')
    })

    const header = [
        '№',
        i18n.global.t('labels.type'),
        i18n.global.t('labels.title'),
        i18n.global.t('labels.code'),
        i18n.global.t('labels.color'),
        i18n.global.t('labels.qr'),
        i18n.global.t('labels.price'),
        i18n.global.t('labels.qty'),
    ]

    formatHeader(worksheet, header)

    // Пример данных для таблицы
    const productTableData = products.map((item, index) => [
        index + 1,
        i18n.global.t('labels.Product'),
        item.orderInvoiceProduct?.product?.name,
        item.orderInvoiceProduct?.product?.code || '-',
        item.orderInvoiceProduct?.color?.name || '-',
        item.orderInvoiceProduct?.product?.qr || '-',
        item.orderInvoiceProduct?.price,
        item.qty,
    ])

    const kitTableData = kits.map((item, index) => [
        productTableData.length + index + 1,
        i18n.global.t('labels.Kit'),
        item.orderInvoiceKit?.kit?.name,
        item.orderInvoiceKit?.kit?.code || '-',
        '-',
        item.orderInvoiceKit?.kit?.qr || '-',
        item.orderInvoiceKit?.price,
        item.qty,
    ])

    const tableData = [...productTableData, ...kitTableData]

    // Добавление данных в таблицу
    tableData.forEach((rowData) => {
        const row = worksheet.addRow(rowData)

        row.eachCell((cell, colNumber) => {
            addBorder(cell)
            textFormat(cell, 'Tahoma', false, 11, '000000')

            if ([1].includes(colNumber)) {
                textAlignment(cell, 'center', 'middle', false)
            } else if ([2, 3, 4, 5, 6].includes(colNumber)) {
                textAlignment(cell, 'left', 'middle', false)
            } else if ([7, 8].includes(colNumber)) {
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
    link.download = `${i18n.global.t('labels.ReturnInvoice')}_${timestamp}.xlsx`
    link.click()
}

export const exportWriteOffInvoice = async (products, kits, location, date) => {
    // Создаем новую книгу и лист
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(i18n.global.t('labels.WriteOffInvoice'))

    setupPage(worksheet, 'portrait')

    // Добавляем заголовки
    worksheet.columns = [
        { width: 6 }, // 1 index
        { width: 16 }, // 2 type
        { width: 32 }, // 3 name
        { width: 16 }, // 4 code
        { width: 14 }, // 5 color
        { width: 14 }, // 6 qr
        { width: 12 }, // 7 costPrice
        { width: 12 }, // 9 qty
        { width: 14 }, // 8 expiryDate
    ]

    const title = [
        [i18n.global.t('labels.location'), location.name],
        [i18n.global.t('labels.createdAt'), formatDate(date)],
        [],
    ]

    title.forEach((row, index) => {
        const rowIndex = index + 1 // Excel нумерация начинается с 1

        const aCell = worksheet.getCell(`A${rowIndex}`)
        const cCell = worksheet.getCell(`C${rowIndex}`)

        worksheet.mergeCells(`A${rowIndex}:B${rowIndex}`)
        worksheet.mergeCells(`C${rowIndex}:E${rowIndex}`)
        aCell.value = row[0]
        cCell.value = row[1]

        textFormat(aCell, 'Tahoma', true, 11, '000000')
        textFormat(cCell, 'Tahoma', false, 11, '000000')
    })

    const header = [
        '№',
        i18n.global.t('labels.type'),
        i18n.global.t('labels.title'),
        i18n.global.t('labels.code'),
        i18n.global.t('labels.color'),
        i18n.global.t('labels.qr'),
        i18n.global.t('labels.costPrice'),
        i18n.global.t('labels.qty'),
        i18n.global.t('labels.expiryDate'),
    ]

    formatHeader(worksheet, header, 30)

    // Пример данных для таблицы
    const productTableData = products.map((item, index) => [
        index + 1,
        i18n.global.t('labels.Product'),
        item.locationQuantity?.product?.name,
        item.locationQuantity?.product?.code || '-',
        item.locationQuantity?.color?.name || '-',
        item.locationQuantity?.product?.qr || '-',
        item.locationQuantity?.product?.costPrice,
        item.qty,
        item.locationQuantity?.expiryDate ? formatDate(item.locationQuantity?.expiryDate) : '-',
    ])

    const kitTableData = kits.map((item, index) => [
        productTableData.length + index + 1,
        i18n.global.t('labels.Kit'),
        item.locationQuantityKit?.kit?.name,
        item.locationQuantityKit?.kit?.code || '-',
        '-',
        item.locationQuantityKit?.kit?.qr || '-',
        item.locationQuantityKit?.kit?.costPrice,
        item.qty,
        item.locationQuantityKit?.expiryDate ? formatDate(item.locationQuantityKit?.expiryDate) : '-',
    ])

    const tableData = [...productTableData, ...kitTableData]

    // Добавление данных в таблицу
    tableData.forEach((rowData) => {
        const row = worksheet.addRow(rowData)

        row.eachCell((cell, colNumber) => {
            addBorder(cell)
            textFormat(cell, 'Tahoma', false, 11, '000000')

            if ([1, 9].includes(colNumber)) {
                textAlignment(cell, 'center', 'middle', false)
            } else if ([2, 3, 4, 5, 6].includes(colNumber)) {
                textAlignment(cell, 'left', 'middle', false)
            } else if ([7, 8].includes(colNumber)) {
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
    link.download = `${i18n.global.t('labels.WriteOffInvoice')}_${timestamp}.xlsx`
    link.click()
}

export const exportKit = async (products, data = {}) => {
    // Создаем новую книгу и лист
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(i18n.global.t('labels.kit'))

    setupPage(worksheet, 'portrait')

    // Добавляем заголовки
    worksheet.columns = [
        { width: 6 }, // 1 index
        { width: 24 }, // 2 product
        { width: 16 }, // 3 code
        { width: 14 }, // 4 color
        { width: 16 }, // 5 category
        { width: 14 }, // 6 type
        { width: 12 }, // 7 qty
        { width: 12 }, // 8 retailPrice
        { width: 12 }, // 9 wholesalePrice
        { width: 12 }, // 10 include/exclude
    ]

    const title = [
        [i18n.global.t('labels.Seller'), data.seller.name],
        [i18n.global.t('labels.qr'), data.qr],
        [i18n.global.t('labels.code'), data.code],
        [i18n.global.t('labels.title'), data.name],
        [i18n.global.t('labels.collection'), data.assembly.name],
        [i18n.global.t('labels.wholesalePrice'), data.wholesalePrice],
        [i18n.global.t('labels.retailPrice'), data.retailPrice],
        [i18n.global.t('labels.qty'), data.qty],
        [],
    ]

    title.forEach((row, index) => {
        const rowIndex = index + 1 // Excel нумерация начинается с 1

        const aCell = worksheet.getCell(`A${rowIndex}`)
        const cCell = worksheet.getCell(`C${rowIndex}`)

        worksheet.mergeCells(`A${rowIndex}:B${rowIndex}`)
        worksheet.mergeCells(`C${rowIndex}:E${rowIndex}`)
        aCell.value = row[0]
        cCell.value = row[1]

        textFormat(aCell, 'Tahoma', true, 11, '000000')
        textFormat(cCell, 'Tahoma', false, 11, '000000')

        if ([5, 6, 7].includes(index)) {
            textAlignment(cCell, 'left', 'middle', false)
        }
    })

    const header = [
        '№',
        i18n.global.t('labels.product'),
        i18n.global.t('labels.code'),
        i18n.global.t('labels.color'),
        i18n.global.t('labels.category'),
        i18n.global.t('labels.type'),
        i18n.global.t('labels.amount'),
        i18n.global.t('labels.retailPrice'),
        i18n.global.t('labels.wholesalePrice'),
        '...',
    ]

    formatHeader(worksheet, header, 30)

    // Пример данных для таблицы
    const tableData = products.map((item, index) => [
        index + 1,
        item.product?.name,
        item.product?.code,
        item.color?.name || '-',
        item.product.category.name,
        item.product.category.categoryType.name,
        item.qty,
        item.product.retailPrice,
        item.product.wholesalePrice,
        item.exclude ? 'exclude': 'include',
    ])

    // Добавление данных в таблицу
    tableData.forEach((rowData) => {
        const row = worksheet.addRow(rowData)

        row.eachCell((cell, colNumber) => {
            addBorder(cell)
            textFormat(cell, 'Tahoma', false, 11, '000000')

            if ([1, 10].includes(colNumber)) {
                textAlignment(cell, 'center', 'middle', false)
            } else if ([2, 3, 4, 5, 6].includes(colNumber)) {
                textAlignment(cell, 'left', 'middle', false)
            } else if ([7, 8, 9].includes(colNumber)) {
                textAlignment(cell, 'right', 'middle', false)
            }
        })
    })

    // Реализовываем футер
    const rowNumber = products.length + 11
    const footerRow = worksheet.getRow(rowNumber)

    // footerTitle
    const titleCell = footerRow.getCell(9)
    titleCell.value = i18n.global.t('labels.totals')

    // totalsValueCell
    const totalsValueCell = footerRow.getCell(10)
    totalsValueCell.value = { formula: `SUMPRODUCT(G11:G${products.length + 10}, H11:H${products.length + 10})` }
    formatNumber(totalsValueCell)

    for (let colNumber = 1; colNumber <= 10; colNumber++) {
        const cell = footerRow.getCell(colNumber)
        fillFormat(cell, 'e6e9ec')
        addBorder(cell)
        textAlignment(cell, 'right', 'middle', false)

        if (colNumber === 9) {
            textFormat(cell, 'Tahoma', true, 10, '000000')
        } else if (colNumber > 9) {
            textFormat(cell, 'Tahoma', false, 11, '000000')
        }
    }

    // ******************************************************************************** //

    // Генерация файла
    const buffer = await workbook.xlsx.writeBuffer()

    // Создание и скачивание файла
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)

    const timestamp = formatDateForFilename()
    link.download = `${i18n.global.t('labels.kit')}_${timestamp}.xlsx`
    link.click()
}

export const exportProductsRemainder = async (isWarehouse = false) => {
    // Создаем новую книгу и лист
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(i18n.global.t(isWarehouse ? 'cards.warehouseContent' : 'cards.shopContent'))
    const locationQuantityStore = useLocationQuantityStore()

    setupPage(worksheet, 'landscape')

    // Добавляем заголовки
    worksheet.columns = [
        { width: 6 }, // 1 id
        { width: 14 }, // 2 code
        { width: 36 }, // 3 name
        { width: 16 }, // 4 type
        { width: 16 }, // 5 Location
        { width: 12 }, // 6 color
        { width: 14 }, // 7 expiryDate
        { width: 8 }, // 8.1 qty
        { width: 8 }, // 8.2 qty
        { width: 12 }, // 9 costPrice
        { width: 18 }, // 10 uzsPrice
        { width: 12 }, // 11 usdPrice
    ]

// ==========================
// 1. Создаем 2 строки header
// ==========================

    const headerRow1 = worksheet.addRow([
        '№',
        i18n.global.t('labels.code'),
        i18n.global.t('labels.title'),
        i18n.global.t('labels.type'),
        i18n.global.t('labels.Location'),
        i18n.global.t('labels.Color'),
        i18n.global.t('labels.expiryDate'),
        i18n.global.t('labels.qty'),
        '', // I1 пустая (будет merge)
        `${i18n.global.t('labels.costPrice')} ($)`,
        i18n.global.t('priceInSoum'),
        i18n.global.t('priceInDollar'),
    ])

    const headerRow2 = worksheet.addRow([
        '', '', '', '', '', '', '',
        i18n.global.t('labels.pcs'),
        i18n.global.t('labels.kg'),
        '', '', '',
    ])

// ==========================
// 2. Merge
// ==========================

// Вертикальные
    ;['A','B','C','D','E','F','G','J','K','L'].forEach(col => {
        worksheet.mergeCells(`${col}1:${col}2`)
    })

// Горизонтальный для qty
    worksheet.mergeCells('H1:I1')

// ==========================
// 3. Форматируем обе строки
// ==========================

    formatHeaderRow(headerRow1)
    formatHeaderRow(headerRow2)

    function formatHeaderRow(row) {
        row.eachCell((cell) => {
            addBorder(cell)
            fillFormat(cell, 'eaecef')
            textFormat(cell, 'Tahoma', true, 10, '000000')
            textAlignment(cell, 'center', 'middle', true)
        })
    }

    // Пример данных для таблицы
    const tableData = locationQuantityStore.getLocationQuantities.models.map((item, index) => [
        index + 1,
        item.product.code,
        item.product.name,
        item.product.category.categoryType.name,
        item.location.name,
        item.color?.name || '-',
        item.expiryDate ? getFormattedDate(item.expiryDate) : '-',
        item.product.category.unit.name === 'pcs' ? item.qty : '',
        item.product.category.unit.name === 'kg' ? item.qty : '',
        item.product?.costPrice,
        item.product?.retailPrice,
        item.product?.wholesalePrice,

    ])

    // Добавление данных в таблицу
    tableData.forEach((rowData) => {
        const row = worksheet.addRow(rowData)

        row.eachCell((cell, colNumber) => {
            addBorder(cell)
            textFormat(cell, 'Tahoma', false, 11, '000000')

            if ([1, 7].includes(colNumber)) {
                textAlignment(cell, 'center', 'middle', false)
            } else if ([2, 3, 4, 5, 6].includes(colNumber)) {
                textAlignment(cell, 'left', 'middle', false)
            } else if ([8, 9, 10, 11, 12].includes(colNumber)) {
                textAlignment(cell, 'right', 'middle', false)
                formatNumber(cell)
            }
        })
    })

    // Реализовываем футер
    const rowNumber = tableData.length + 3
    const footerRow = worksheet.getRow(rowNumber)

    // footerTitle
    const titleCell = footerRow.getCell(7)
    titleCell.value = i18n.global.t('labels.totals')

    // totalPcsCell
    const totalPcsCell = footerRow.getCell(8)
    totalPcsCell.value = { formula: `SUM(H3:H${tableData.length + 2})` }
    formatNumber(totalPcsCell)

    // totalKgCell
    const totalKgCell = footerRow.getCell(9)
    totalKgCell.value = { formula: `SUM(I3:I${tableData.length + 2})` }
    formatNumber(totalKgCell)

    // totalCostPriceCell
    const totalCostPriceCell = footerRow.getCell(10)
    totalCostPriceCell.value = { formula: `SUMPRODUCT(H3:H${tableData.length + 2}, J3:J${tableData.length + 2})+SUMPRODUCT(I3:I${tableData.length + 2}, J3:J${tableData.length + 2})` }
    formatNumber(totalCostPriceCell)

    // totalUzsPriceCell
    const totalUzsPriceCell = footerRow.getCell(11)
    totalUzsPriceCell.value = { formula: `SUMPRODUCT(H3:H${tableData.length + 2}, K3:K${tableData.length + 2})+SUMPRODUCT(I3:I${tableData.length + 2}, K3:K${tableData.length + 2})` }
    formatNumber(totalUzsPriceCell)

    // totalUsdPriceCell
    const totalUsdPriceCell = footerRow.getCell(12)
    totalUsdPriceCell.value = { formula: `SUMPRODUCT(H3:H${tableData.length + 2}, L3:L${tableData.length + 2})+SUMPRODUCT(I3:I${tableData.length + 2}, L3:L${tableData.length + 2})` }
    formatNumber(totalUsdPriceCell)

    for (let colNumber = 1; colNumber <= 12; colNumber++) {
        const cell = footerRow.getCell(colNumber)
        fillFormat(cell, 'e6e9ec')
        addBorder(cell)
        textAlignment(cell, 'right', 'middle', false)
        textFormat(cell, 'Tahoma', true, 11, '000000')
    }

    // ******************************************************************************** //

    // Генерация файла
    const buffer = await workbook.xlsx.writeBuffer()

    // Создание и скачивание файла
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)

    const timestamp = formatDateForFilename()
    link.download = `${i18n.global.t(isWarehouse ? 'cards.warehouseContent' : 'cards.shopContent')}_${timestamp}.xlsx`
    link.click()
}

export const exportKitsRemainder = async (isWarehouse = false) => {
    // Создаем новую книгу и лист
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(i18n.global.t(isWarehouse ? 'cards.warehouseContent' : 'cards.shopContent'))
    const locationQuantityKitStore = useLocationQuantityKitStore()

    setupPage(worksheet, 'portrait')

    // Добавляем заголовки
    worksheet.columns = [
        { width: 6 }, // 1 index
        { width: 14 }, // 2 code
        { width: 36 }, // 3 name
        { width: 16 }, // 4 location
        { width: 14 }, // 5 expiryDate
        { width: 16 }, // 6 qty
        { width: 12 }, // 7 costPrice
        { width: 18 }, // 8 uzsPrice
        { width: 12 }, // 9 usdPrice
    ]

    const header = [
        '№',
        i18n.global.t('labels.code'),
        i18n.global.t('labels.title'),
        i18n.global.t('labels.Location'),
        i18n.global.t('labels.expiryDate'),
        `${i18n.global.t('labels.qty')} (${i18n.global.t('labels.pcs')})`,
        `${i18n.global.t('labels.costPrice')} ($)`,
        i18n.global.t('priceInSoum'),
        i18n.global.t('priceInDollar'),
    ]

    formatHeader(worksheet, header, 30)

    // Пример данных для таблицы
    const tableData = locationQuantityKitStore.getLocationQuantityKits.models.map((item, index) => [
        index + 1,
        item.kit?.code,
        item.kit?.name,
        item.location?.name,
        item.expiryDate ? getFormattedDate(item.expiryDate) : '-',
        item.qty,
        item.kit?.costPrice,
        item.kit?.retailPrice,
        item.kit?.wholesalePrice,

    ])

    // Добавление данных в таблицу
    tableData.forEach((rowData) => {
        const row = worksheet.addRow(rowData)

        row.eachCell((cell, colNumber) => {
            addBorder(cell)
            textFormat(cell, 'Tahoma', false, 11, '000000')

            if ([1, 5].includes(colNumber)) {
                textAlignment(cell, 'center', 'middle', false)
            } else if ([2, 3, 4].includes(colNumber)) {
                textAlignment(cell, 'left', 'middle', false)
            } else if ([6, 7, 8, 9].includes(colNumber)) {
                textAlignment(cell, 'right', 'middle', false)
                formatNumber(cell)
            }
        })
    })

    // Реализовываем футер
    const rowNumber = tableData.length + 2
    const footerRow = worksheet.getRow(rowNumber)

    // footerTitle
    const titleCell = footerRow.getCell(5)
    titleCell.value = i18n.global.t('labels.totals')

    // totalQtyCell
    const totalPcsCell = footerRow.getCell(6)
    totalPcsCell.value = { formula: `SUM(F2:F${tableData.length + 1})` }
    formatNumber(totalPcsCell)

    // totalCostPriceCell
    const totalCostPriceCell = footerRow.getCell(7)
    totalCostPriceCell.value = { formula: `SUMPRODUCT(F2:F${tableData.length + 1}, G2:G${tableData.length + 1})` }
    formatNumber(totalCostPriceCell)

    // totalUzsPriceCell
    const totalUzsPriceCell = footerRow.getCell(8)
    totalUzsPriceCell.value = { formula: `SUMPRODUCT(F2:F${tableData.length + 1}, H2:H${tableData.length + 1})` }
    formatNumber(totalUzsPriceCell)

    // totalUsdPriceCell
    const totalUsdPriceCell = footerRow.getCell(9)
    totalUsdPriceCell.value = { formula: `SUMPRODUCT(F2:F${tableData.length + 1}, I2:I${tableData.length + 1})` }
    formatNumber(totalUsdPriceCell)

    for (let colNumber = 1; colNumber <= 9; colNumber++) {
        const cell = footerRow.getCell(colNumber)
        fillFormat(cell, 'e6e9ec')
        addBorder(cell)
        textAlignment(cell, 'right', 'middle', false)
        textFormat(cell, 'Tahoma', true, 11, '000000')
    }

    // ******************************************************************************** //

    // Генерация файла
    const buffer = await workbook.xlsx.writeBuffer()

    // Создание и скачивание файла
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)

    const timestamp = formatDateForFilename()
    link.download = `${i18n.global.t(isWarehouse ? 'cards.warehouseContent' : 'cards.shopContent')}_${timestamp}.xlsx`
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

function formatHeader(worksheet, header, height = 0) {
    const headerRow = worksheet.addRow(header)

    if (height > 0) {
        headerRow.height = height
    }

    // Форматирование заголовка таблицы
    headerRow.eachCell((cell) => {
        addBorder(cell)
        fillFormat(cell, 'eaecef')
        textFormat(cell, 'Tahoma', true, 10, '000000')
        textAlignment(cell, 'center', 'middle', height > 0)
    })
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