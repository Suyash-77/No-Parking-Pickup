import jsPDF from 'jspdf'

const generateReceipt = (receipt) => {
    const doc = new jsPDF()

    doc.setFillColor(255, 255, 255)
    doc.rect(0, 0, 210, 297, 'F')

    doc.setFillColor(16, 185, 129)
    doc.rect(0, 0, 210, 20, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('NO PARKING PICKUP', 14, 13)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Official Payment Receipt', 152, 13)

    doc.setTextColor(30, 30, 30)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Payment Receipt', 14, 38)

    doc.setDrawColor(16, 185, 129)
    doc.setLineWidth(1.2)
    doc.line(14, 42, 75, 42)

    doc.setFillColor(220, 252, 231)
    doc.roundedRect(14, 48, 36, 9, 2, 2, 'F')
    doc.setTextColor(16, 185, 129)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('PAID', 25, 54.5)

    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.3)
    doc.roundedRect(14, 64, 182, 150, 4, 4, 'FD')

    // Fields
    const fields = [
        { label: 'Receipt No.',    value: receipt.receipt_number },
        { label: 'Transaction ID', value: receipt.transaction_id },
        { label: 'Plate Number',   value: receipt.plate_number },
        { label: 'Owner Name',     value: receipt.owner_name },
        { label: 'Fine Amount',    value: `Rs. ${receipt.fine_amount}` },
        { label: 'Paid At',        value: receipt.paid_at },
        { label: 'Status',         value: 'Payment Successful' },
    ]

    let y = 78
    fields.forEach(({ label, value }, i) => {
        if (i > 0) {
            doc.setDrawColor(220, 220, 220)
            doc.setLineWidth(0.3)
            doc.line(24, y - 4, 186, y - 4)
        }

        doc.setTextColor(100, 100, 100)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.text(label.toUpperCase(), 24, y)

        if (label === 'Fine Amount') {
            doc.setTextColor(16, 185, 129)
            doc.setFont('helvetica', 'bold')
        } else if (label === 'Status') {
            doc.setTextColor(16, 185, 129)
            doc.setFont('helvetica', 'normal')
        } else {
            doc.setTextColor(30, 30, 30)
            doc.setFont('helvetica', 'normal')
        }
        doc.setFontSize(11)
        doc.text(String(value), 24, y + 7)

        y += 20
    })

    doc.setFillColor(240, 253, 244)
    doc.setDrawColor(16, 185, 129)
    doc.setLineWidth(0.5)
    doc.roundedRect(14, 222, 182, 16, 3, 3, 'FD')
    doc.setTextColor(16, 185, 129)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Your vehicle will be released shortly by the authority. Thank you!', 105, 232, { align: 'center' })

    doc.setTextColor(160, 160, 160)
    doc.setFontSize(8)
    doc.text('No Parking Pickup  |  This is a system-generated receipt', 105, 285, { align: 'center' })

    doc.save(`receipt-${receipt.receipt_number}.pdf`)
}

export default generateReceipt