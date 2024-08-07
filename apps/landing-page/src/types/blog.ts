export interface Author {
  name: string;
  image: string;
  bio?: string;
  _id?: number | string;
  _ref?: number | string;
}

export interface Blog {
  id: number;
  title: string;
  slug?: unknown;
  metadata?: string;
  body?: string;
  mainImage?: string;
  author?: Author;
  tags?: string[];
  publishedAt?: string;
}
