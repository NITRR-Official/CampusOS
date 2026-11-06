import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { Mermaid } from './mermaid';
import type { ReactNode } from 'react';

function extractText(node: ReactNode): string {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (typeof node === 'object' && 'props' in node && node.props) {
    return extractText((node.props as { children?: ReactNode }).children);
  }
  return '';
}

const MERMAID_REGEX =
  /^(?:%%\s*.*\r?\n\s*)*(flowchart|sequenceDiagram|graph|classDiagram|stateDiagram|erDiagram|gantt|pie|gitGraph|mindmap|timeline|quadrantChart|journey|sankey-beta|xychart-beta|block-beta|packet-beta|architecture-beta|zenuml|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment)\b/;

function CustomPre(props: any) {
  const codeChild = props.children;
  const rawText = extractText(codeChild).trim();

  const isMermaidLang =
    props['data-language'] === 'mermaid' ||
    props.className?.includes('language-mermaid') ||
    codeChild?.props?.className?.includes('language-mermaid') ||
    codeChild?.props?.['data-language'] === 'mermaid';

  const isMermaidSyntax = MERMAID_REGEX.test(rawText);

  if (isMermaidLang || isMermaidSyntax) {
    return <Mermaid chart={rawText} />;
  }

  const DefaultPre = defaultMdxComponents.pre as any;
  return <DefaultPre {...props} />;
}

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    pre: CustomPre,
    Mermaid,
    ...components
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
