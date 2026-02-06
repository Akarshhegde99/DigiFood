import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { Order, OrderItem } from '@/types'

export async function generateInvoicePdf(order: Order, items: OrderItem[]) {
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([600, 800])
    const { width, height } = page.getSize()

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Header
    page.drawText('DIGIFOOD', { x: 50, y: height - 50, size: 30, font: boldFont, color: rgb(0.85, 0.47, 0.02) })
    page.drawText('Official Digital Invoice | Premium Dining Experience', { x: 50, y: height - 80, size: 12, font })

    // Order Info
    page.drawText(`Order ID: ${order.id}`, { x: 50, y: height - 120, size: 10, font })
    page.drawText(`Date: ${new Date(order.created_at).toLocaleString()}`, { x: 50, y: height - 135, size: 10, font })
    page.drawText(`Visit Time: ${new Date(order.visit_time).toLocaleString()}`, { x: 50, y: height - 150, size: 10, font: boldFont })
    page.drawText(`Customer: ${order.customer_name || 'N/A'}`, { x: 50, y: height - 165, size: 10, font })

    // Table Header
    const tableTop = height - 200
    page.drawRectangle({ x: 50, y: tableTop - 5, width: 500, height: 20, color: rgb(0.95, 0.95, 0.95) })
    page.drawText('Item', { x: 60, y: tableTop, size: 10, font: boldFont })
    page.drawText('Qty', { x: 350, y: tableTop, size: 10, font: boldFont })
    page.drawText('Price', { x: 400, y: tableTop, size: 10, font: boldFont })
    page.drawText('Total', { x: 500, y: tableTop, size: 10, font: boldFont })

    // Items
    let y = tableTop - 25
    items.forEach(item => {
        const itemName = item.menu_item?.name || (item as any).menu_items?.name || 'Item'
        page.drawText(itemName, { x: 60, y, size: 10, font })
        page.drawText(item.quantity.toString(), { x: 350, y, size: 10, font })
        page.drawText(`Rs. ${item.price_at_time.toFixed(0)}`, { x: 400, y, size: 10, font })
        page.drawText(`Rs. ${(item.price_at_time * item.quantity).toFixed(0)}`, { x: 500, y, size: 10, font })
        y -= 20
    })

    // Summary
    const summaryTop = y - 40
    page.drawRectangle({ x: 350, y: summaryTop - 60, width: 200, height: 80, color: rgb(0.98, 0.98, 0.98) })

    page.drawText(`Subtotal: Rs. ${order.total_amount.toFixed(0)}`, { x: 360, y: summaryTop - 10, size: 12, font })
    page.drawText(`Paid Now (50%): Rs. ${order.paid_amount.toFixed(0)}`, { x: 360, y: summaryTop - 30, size: 12, font: boldFont, color: rgb(0.1, 0.6, 0.1) })
    page.drawText(`Remaining: Rs. ${(order.total_amount - order.paid_amount).toFixed(0)}`, { x: 360, y: summaryTop - 50, size: 12, font: boldFont, color: rgb(0.8, 0.1, 0.1) })

    // Digital Signature
    const sigY = summaryTop - 120
    page.drawText('Digitally Verified By:', { x: 360, y: sigY, size: 10, font })
    page.drawText('Akarsh Hegde', { x: 360, y: sigY - 20, size: 16, font: boldFont, color: rgb(0.1, 0.1, 0.1) })
    page.drawLine({ start: { x: 360, y: sigY - 25 }, end: { x: 500, y: sigY - 25 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) })
    page.drawText('AUTHORIZED RITUAL SIGNATURE', { x: 360, y: sigY - 35, size: 6, font, color: rgb(0.5, 0.5, 0.5) })

    // Footer
    page.drawText('Thank you for choosing DigiFood!', { x: width / 2 - 100, y: 50, size: 10, font, color: rgb(0.5, 0.5, 0.5) })
    page.drawText('Please show this invoice upon arrival.', { x: width / 2 - 90, y: 35, size: 10, font, color: rgb(0.5, 0.5, 0.5) })

    const pdfBytes = await pdfDoc.save()
    return pdfBytes
}
