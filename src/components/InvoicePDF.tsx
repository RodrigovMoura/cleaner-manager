import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 11,
    padding: 40,
    color: "#1f2937",
    backgroundColor: "#ffffff",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 20,
    marginBottom: 20,
  },
  companyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  companySubtitle: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 3,
  },
  invoiceBadge: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2563eb",
    textAlign: "right",
  },
  invoiceNumber: {
    fontSize: 10,
    color: "#4b5563",
    marginTop: 2,
    textAlign: "right",
  },
  infoSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  infoCol: {
    width: "48%",
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#9ca3af",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  clientName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#111827",
  },
  infoText: {
    fontSize: 10,
    color: "#4b5563",
    marginTop: 2,
  },
  table: {
    width: "100%",
    marginBottom: 25,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    padding: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    padding: 8,
  },
  colDescription: {
    width: "75%",
  },
  colAmount: {
    width: "25%",
    textAlign: "right",
  },
  colHeaderText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#4b5563",
    textTransform: "uppercase",
  },
  colItemText: {
    fontSize: 10,
    color: "#1f2937",
  },
  totalsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 30,
  },
  totalsBox: {
    width: "40%",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#111827",
  },
  totalValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#2563eb",
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 15,
    marginTop: "auto",
  },
  footerTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 3,
  },
  footerText: {
    fontSize: 9,
    color: "#6b7280",
    lineHeight: 1.4,
  },
});

interface InvoicePDFProps {
  invoice: {
    invoiceNumber: string;
    amount: number | string;
    dueDate: Date | string;
    createdAt: Date | string;
    status: string;
    client: {
      name: string;
      email?: string | null;
      phone?: string | null;
      address?: string | null;
    };
    appointment?: {
      date: Date | string;
    } | null;
  };
}

export default function InvoicePDF({ invoice }: InvoicePDFProps) {
  const issueDate = new Date(invoice.createdAt).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const dueDate = new Date(invoice.dueDate).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const serviceDate = invoice.appointment
    ? new Date(invoice.appointment.date).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : issueDate;

  return (
    <Document>
      <Page size='A4' style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.companyTitle}>Cleaner Manager</Text>
            <Text style={styles.companySubtitle}>Residential Cleaning Services</Text>
          </View>
          <View>
            <Text style={styles.invoiceBadge}>TAX INVOICE</Text>
            <Text style={styles.invoiceNumber}>Invoice #: {invoice.invoiceNumber}</Text>
          </View>
        </View>

        {/* Bill To & Invoice Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoCol}>
            <Text style={styles.sectionTitle}>Billed To</Text>
            <Text style={styles.clientName}>{invoice.client.name}</Text>
            {invoice.client.address && <Text style={styles.infoText}>{invoice.client.address}</Text>}
            {invoice.client.email && <Text style={styles.infoText}>{invoice.client.email}</Text>}
            {invoice.client.phone && <Text style={styles.infoText}>{invoice.client.phone}</Text>}
          </View>

          <View style={styles.infoCol}>
            <Text style={styles.sectionTitle}>Invoice Details</Text>
            <Text style={styles.infoText}>Date Issued: {issueDate}</Text>
            <Text style={styles.infoText}>Due Date: {dueDate}</Text>
            <Text style={styles.infoText}>Payment Status: {invoice.status}</Text>
          </View>
        </View>

        {/* Service Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.colDescription}>
              <Text style={styles.colHeaderText}>Description</Text>
            </View>
            <View style={styles.colAmount}>
              <Text style={styles.colHeaderText}>Amount</Text>
            </View>
          </View>

          <View style={styles.tableRow}>
            <View style={styles.colDescription}>
              <Text style={styles.colItemText}>Residential Cleaning Service ({serviceDate})</Text>
            </View>
            <View style={styles.colAmount}>
              <Text style={styles.colItemText}>${Number(invoice.amount).toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Due (AUD):</Text>
              <Text style={styles.totalValue}>${Number(invoice.amount).toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Payment Details Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>Payment Instructions</Text>
          <Text style={styles.footerText}>
            Please transfer the amount due by the date indicated. Thank you for your business!
          </Text>
        </View>
      </Page>
    </Document>
  );
}
