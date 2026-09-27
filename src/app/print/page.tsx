import type { Metadata } from "next";
import {pageMetadata} from "@/lib/seo";
import PrintOrderForm from "@/components/print-order-form";
export const metadata:Metadata=pageMetadata('Online Printing in Jamshedpur | Print & Scan','Upload a document, select exact pages and print settings, get a clear estimate, and schedule pickup or delivery at NISE COMPORT Kharangajhar.','/print');
export default function PrintPage(){return <PrintOrderForm/>}
