// Localized, user-facing messages returned by the /api/analyze-quotes and
// /api/extract-soil-test handlers.
//
// These are SERVER responses (parsing errors, AI-service failures, rate limits, verification
// and document-extraction results), kept out of the UI dictionaries so the server layer owns
// them. Like dictionaries.ts they are hand-written per locale and parity-checked
// (analyze-messages.test.ts) so a half-translated message can never ship. Messages never name
// the AI provider and never echo raw provider output.
//
// Framework-free (no React / import.meta) so it unit-tests with node --test and bundles into
// the server function.

import { DEFAULT_LOCALE, type Locale } from "./i18n.ts";

export interface AnalyzeMessages {
  // verification / configuration
  verificationRequired: string;
  verificationFailed: string;
  verificationNotConfigured: string;
  notConfigured: string;
  // request validation
  fieldsRequired: string;
  invalidUpload: string;
  uploadTooLarge: string;
  plantingFuture: string;
  rateLimited: string;
  // AI service outcomes (no provider name, no raw output)
  aiTimeout: string;
  aiUnreadable: string;
  aiBusy: string;
  aiOverloaded: string;
  aiBadUpload: string;
  aiFailed: string;
  // document extraction ({file} is replaced with the uploaded file name)
  docCorrupt: string;
  docEmpty: string;
  docImageOnly: string;
  noUsableContent: string;
  noProductsFound: string;
}

const en: AnalyzeMessages = {
  verificationRequired: "Verification is required. Please try again.",
  verificationFailed: "Verification failed or expired. Please try again.",
  verificationNotConfigured: "Verification is not configured yet. Please try again later.",
  notConfigured: "Quote analysis is not available yet. Please try again later.",
  fieldsRequired:
    "Add your location, crop, preferences, field size and water source, then try again.",
  invalidUpload: "That upload could not be read. Please try again.",
  uploadTooLarge: "The upload is too large. Use up to 8 files under 10 MB each.",
  plantingFuture: "The planting date cannot be in the future.",
  rateLimited: "Too many analyses from this connection. Please try again in a few minutes.",
  aiTimeout: "The analysis service did not respond in time. Please try again.",
  aiUnreadable: "The analysis could not be read. Please try again.",
  aiBusy: "The analysis service is busy right now. Please try again in a few minutes.",
  aiOverloaded:
    "The analysis service is temporarily unavailable. Please try again in a few minutes.",
  aiBadUpload:
    "That upload could not be processed. Try a clearer photo, PDF, or a document with selectable text.",
  aiFailed: "We couldn't analyze those files. Please try again.",
  docCorrupt:
    'We couldn\'t read "{file}" — the document looks corrupted. Re-export it and try again.',
  docEmpty:
    '"{file}" has no readable text. Add a document with selectable text, or a photo or PDF of the quote.',
  docImageOnly:
    '"{file}" contains only images, so no text could be read. Upload a photo or PDF of the quote instead.',
  noUsableContent:
    "None of the uploaded files contained readable quote text. Upload a clear photo, a PDF, or a document with selectable text.",
  noProductsFound:
    "No identifiable fertilizer product or fertilizer grade was found in the uploaded files. Check that the upload shows the product name or analysis clearly.",
};

const ptBR: AnalyzeMessages = {
  verificationRequired: "A verificação é obrigatória. Tente novamente.",
  verificationFailed: "A verificação falhou ou expirou. Tente novamente.",
  verificationNotConfigured:
    "A verificação ainda não está configurada. Tente novamente mais tarde.",
  notConfigured: "A análise de cotações ainda não está disponível. Tente novamente mais tarde.",
  fieldsRequired:
    "Informe a localização, a cultura, as preferências, o tamanho da área e a fonte de água e tente novamente.",
  invalidUpload: "Não foi possível ler esse envio. Tente novamente.",
  uploadTooLarge: "O envio é muito grande. Use até 8 arquivos de no máximo 10 MB cada.",
  plantingFuture: "A data de plantio não pode estar no futuro.",
  rateLimited: "Muitas análises a partir desta conexão. Tente novamente em alguns minutos.",
  aiTimeout: "O serviço de análise não respondeu a tempo. Tente novamente.",
  aiUnreadable: "Não foi possível ler a análise. Tente novamente.",
  aiBusy: "O serviço de análise está ocupado no momento. Tente novamente em alguns minutos.",
  aiOverloaded:
    "O serviço de análise está temporariamente indisponível. Tente novamente em alguns minutos.",
  aiBadUpload:
    "Não foi possível processar esse envio. Tente uma foto mais nítida, um PDF ou um documento com texto selecionável.",
  aiFailed: "Não foi possível analisar esses arquivos. Tente novamente.",
  docCorrupt:
    'Não foi possível ler "{file}" — o documento parece corrompido. Exporte novamente e tente de novo.',
  docEmpty:
    '"{file}" não tem texto legível. Envie um documento com texto selecionável, ou uma foto ou PDF da cotação.',
  docImageOnly:
    '"{file}" contém apenas imagens, então não foi possível ler nenhum texto. Envie uma foto ou PDF da cotação.',
  noUsableContent:
    "Nenhum dos arquivos enviados continha texto de cotação legível. Envie uma foto nítida, um PDF ou um documento com texto selecionável.",
  noProductsFound:
    "Nenhum produto ou formulação de fertilizante identificável foi encontrado nos arquivos enviados. Verifique se o envio mostra claramente o nome do produto ou a análise.",
};

const es419: AnalyzeMessages = {
  verificationRequired: "Se requiere la verificación. Inténtalo de nuevo.",
  verificationFailed: "La verificación falló o expiró. Inténtalo de nuevo.",
  verificationNotConfigured: "La verificación aún no está configurada. Inténtalo más tarde.",
  notConfigured: "El análisis de cotizaciones aún no está disponible. Inténtalo más tarde.",
  fieldsRequired:
    "Agrega la ubicación, el cultivo, las preferencias, el tamaño del campo y la fuente de agua, y vuelve a intentarlo.",
  invalidUpload: "No se pudo leer ese archivo. Inténtalo de nuevo.",
  uploadTooLarge: "El envío es demasiado grande. Usa hasta 8 archivos de máximo 10 MB cada uno.",
  plantingFuture: "La fecha de siembra no puede estar en el futuro.",
  rateLimited: "Demasiados análisis desde esta conexión. Inténtalo de nuevo en unos minutos.",
  aiTimeout: "El servicio de análisis no respondió a tiempo. Inténtalo de nuevo.",
  aiUnreadable: "No se pudo leer el análisis. Inténtalo de nuevo.",
  aiBusy:
    "El servicio de análisis está ocupado en este momento. Inténtalo de nuevo en unos minutos.",
  aiOverloaded:
    "El servicio de análisis no está disponible temporalmente. Inténtalo de nuevo en unos minutos.",
  aiBadUpload:
    "No se pudo procesar ese archivo. Prueba con una foto más clara, un PDF o un documento con texto seleccionable.",
  aiFailed: "No pudimos analizar esos archivos. Inténtalo de nuevo.",
  docCorrupt:
    'No pudimos leer "{file}": el documento parece dañado. Vuelve a exportarlo e inténtalo de nuevo.',
  docEmpty:
    '"{file}" no tiene texto legible. Sube un documento con texto seleccionable, o una foto o PDF de la cotización.',
  docImageOnly:
    '"{file}" solo contiene imágenes, así que no se pudo leer texto. Sube una foto o PDF de la cotización.',
  noUsableContent:
    "Ninguno de los archivos enviados contenía texto de cotización legible. Sube una foto clara, un PDF o un documento con texto seleccionable.",
  noProductsFound:
    "No se encontró ningún producto o fórmula de fertilizante identificable en los archivos enviados. Verifica que el archivo muestre claramente el nombre del producto o el análisis.",
};

const BY_LOCALE: Record<Locale, AnalyzeMessages> = {
  en,
  "pt-BR": ptBR,
  "es-419": es419,
};

/** Localized analyze/parse messages for a locale (English fallback for anything unknown). */
export function analyzeMessages(locale: Locale): AnalyzeMessages {
  return BY_LOCALE[locale] ?? BY_LOCALE[DEFAULT_LOCALE];
}

/** Fill a `{file}`-style template. Only whitelisted keys are substituted. */
export function fillMessage(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? vars[key] : match));
}
