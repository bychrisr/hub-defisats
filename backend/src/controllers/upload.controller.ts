import { FastifyRequest, FastifyReply } from 'fastify';
import { pipeline } from 'stream/promises';
import { createWriteStream, mkdirSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

export class UploadController {

  // Endpoint para upload de avatar
  static async uploadAvatar(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      if (!user) {
        return reply.status(401).send({
          error: 'UNAUTHORIZED',
          message: 'Usuário não autenticado'
        });
      }

      // Obter arquivo do multipart
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({
          error: 'NO_FILE',
          message: 'Nenhum arquivo enviado'
        });
      }

      // Validar tipo de arquivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(data.mimetype)) {
        return reply.status(400).send({
          error: 'INVALID_FILE_TYPE',
          message: 'Tipo de arquivo não suportado. Use: JPEG, PNG ou WEBP'
        });
      }

      // Criar diretório de upload se não existir
      const uploadDir = join(process.cwd(), 'uploads', 'avatars');
      if (!existsSync(uploadDir)) {
        mkdirSync(uploadDir, { recursive: true });
      }

      // Gerar nome único para o arquivo
      const filename = `${randomUUID()}${extname(data.filename || 'image.jpg')}`;
      const filePath = join(uploadDir, filename);

      // Processar e salvar imagem com Sharp
      const buffer = await data.toBuffer();
      
      await sharp(buffer)
        .resize(400, 400, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 90 })
        .toFile(filePath);

      // Retornar URL da imagem
      const imageUrl = `/uploads/avatars/${filename}`;
      
      return reply.status(200).send({
        success: true,
        message: 'Avatar atualizado com sucesso',
        imageUrl,
        filename
      });

    } catch (error) {
      console.error('Error uploading avatar:', error);
      return reply.status(500).send({
        error: 'UPLOAD_FAILED',
        message: 'Erro ao fazer upload do avatar'
      });
    }
  }

  // Endpoint para obter avatar
  static async getAvatar(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { filename } = request.params as { filename: string };
      const imagePath = join(process.cwd(), 'uploads', 'avatars', filename);
      
      if (!existsSync(imagePath)) {
        return reply.status(404).send({
          error: 'NOT_FOUND',
          message: 'Avatar não encontrado'
        });
      }

      return reply.sendFile(filename, join(process.cwd(), 'uploads', 'avatars'));

    } catch (error) {
      console.error('Error getting avatar:', error);
      return reply.status(500).send({
        error: 'GET_AVATAR_FAILED',
        message: 'Erro ao obter avatar'
      });
    }
  }

  // Endpoint para deletar avatar
  static async deleteAvatar(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      if (!user) {
        return reply.status(401).send({
          error: 'UNAUTHORIZED',
          message: 'Usuário não autenticado'
        });
      }

      const { filename } = request.params as { filename: string };
      const imagePath = join(process.cwd(), 'uploads', 'avatars', filename);
      
      if (existsSync(imagePath)) {
        const fs = require('fs');
        fs.unlinkSync(imagePath);
      }

      return reply.status(200).send({
        success: true,
        message: 'Avatar removido com sucesso'
      });

    } catch (error) {
      console.error('Error deleting avatar:', error);
      return reply.status(500).send({
        error: 'DELETE_AVATAR_FAILED',
        message: 'Erro ao remover avatar'
      });
    }
  }
}
