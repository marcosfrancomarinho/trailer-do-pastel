import { DomainError } from '../../errors/domain-error.js';

export class ProductImageUrl {
  private constructor(private readonly value: string) {}

  public static create(value: string): ProductImageUrl {
    if (typeof value !== 'string') {
      throw new DomainError('imageUrl', 'INVALID_TYPE', 'A URL da imagem deve ser um texto.');
    }

    const imageUrl = value.trim();
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(imageUrl);
    } catch {
      throw new DomainError('imageUrl', 'INVALID_FORMAT', 'Informe uma URL válida para a imagem.');
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new DomainError('imageUrl', 'INVALID_FORMAT', 'A URL da imagem deve usar HTTP ou HTTPS.');
    }

    return new ProductImageUrl(imageUrl);
  }

  public getValue(): string {
    return this.value;
  }
}
