import type { Metadata } from "next";
import {pageMetadata} from "@/lib/seo";
import PrintOrderForm from "@/components/print-order-form";
export const metadata:Metadata=pageMetadata('Online Printing in Jamshedpur | Print & Scan','Upload a document, select exact pages and print settings, request an estimate, and schedule pickup or delivery at NISE COMPORT Kharangajhar. No online checkout or payment.','/print');
export default function PrintPage(){return <PrintOrderForm/>}
