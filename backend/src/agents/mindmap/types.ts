import { IWorkflowContext } from '../core/types';

export interface IMindmapNode {
    id: string;
    label: string;
    description?: string;
    type: 'root' | 'topic' | 'subtopic';
}

export interface IMindmapEdge {
    source: string;
    target: string;
    label?: string;
}

export interface IMindmapContext extends IWorkflowContext {
    pdfId: string;
    pdfName: string;

    // Intermediate
    documentChunks?: string[];

    // Output
    nodes?: IMindmapNode[];
    edges?: IMindmapEdge[];
}
