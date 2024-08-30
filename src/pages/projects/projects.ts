import { getRepositoryDetails } from "../../utils";

export interface Project {
  name: string;
  demoLink: string;
  tags?: string[],
  description?: string;
  postLink?: string;
  demoLinkRel?: string;
  [key: string]: any;
}

export const projects: Project[] = [
  {
    name: 'levandong.com',
    description: 'Đây là blog chia sẻ chung về lập trình và công nghệ thông tin.',
    demoLink: 'https://www.levandong.com',
    tags: ['Blog']
  },
  {
    name: 'CSharp Tourist',
    description: 'CSharp Tourist là một blog chia sẻ về lập trình C#.',
    demoLink: 'https://levandong.dev',
    tags: ['Blog', 'C#']
  },
  {
    name: 'gsTool',
    description: 'Đây là một công cụ hỗ trợ copy Google Drive thông qua AppScript.',
    demoLink: 'https://github.com/itlvd/gstool',
    demoLinkRel: 'nofollow noopener noreferrer',
    tags: ['AppScript', 'Javascript']
  }
]
