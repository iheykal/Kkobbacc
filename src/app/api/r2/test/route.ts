import { NextRequest, NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

import { getR2Endpoint } from '@/lib/getR2Endpoint';

const client = new S3Client({
  region: "auto",
  endpoint: getR2Endpoint(),
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
  maxAttempts: 3,
  // Add timeout configuration
  requestHandler: {
    httpOptions: {
      timeout: 30000,
    },
  },
});

export async function GET(req: NextRequest) {
  try {
    // Check environment variables
    const envCheck = {
      R2_ENDPOINT: !!process.env.R2_ENDPOINT,
      R2_ACCESS_KEY_ID: !!process.env.R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY: !!process.env.R2_SECRET_ACCESS_KEY,
      R2_BUCKET: !!process.env.R2_BUCKET,
      R2_PUBLIC_BASE: !!process.env.R2_PUBLIC_BASE,
    };

    // Test basic connectivity to the endpoint
    try {
      const response = await fetch(process.env.R2_ENDPOINT!, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(10000)
      });
    } catch (connectivityError) {
      // Silent error handling
    }

    if (!process.env.R2_BUCKET) {
      return NextResponse.json({ 
        success: false, 
        error: "R2_BUCKET environment variable is missing",
        envCheck 
      }, { status: 500 });
    }

    let firstError: any = null;

    // Try different endpoint configurations
    const endpointConfigs = [
      {
        name: 'Original endpoint',
        endpoint: process.env.R2_ENDPOINT,
        config: {
          region: "auto",
          endpoint: process.env.R2_ENDPOINT,
          credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID!,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
          },
          forcePathStyle: true,
          maxAttempts: 3,
          requestHandler: {
            httpOptions: {
              timeout: 30000,
            },
          },
        }
      },
      {
        name: 'Alternative endpoint format (pub-)',
        endpoint: process.env.R2_ENDPOINT?.replace('https://', 'https://pub-'),
        config: {
          region: "auto",
          endpoint: process.env.R2_ENDPOINT?.replace('https://', 'https://pub-'),
          credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID!,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
          },
          forcePathStyle: true,
          maxAttempts: 3,
          requestHandler: {
            httpOptions: {
              timeout: 30000,
            },
          },
        }
      },
      {
        name: 'Alternative endpoint format (.dev)',
        endpoint: process.env.R2_ENDPOINT?.replace('.com', '.dev'),
        config: {
          region: "auto",
          endpoint: process.env.R2_ENDPOINT?.replace('.com', '.dev'),
          credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID!,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
          },
          forcePathStyle: true,
          maxAttempts: 3,
          requestHandler: {
            httpOptions: {
              timeout: 30000,
            },
          },
        }
      },
      {
        name: 'Alternative endpoint format (pub- + .dev)',
        endpoint: process.env.R2_ENDPOINT?.replace('https://', 'https://pub-').replace('.com', '.dev'),
        config: {
          region: "auto",
          endpoint: process.env.R2_ENDPOINT?.replace('https://', 'https://pub-').replace('.com', '.dev'),
          credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID!,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
          },
          forcePathStyle: true,
          maxAttempts: 3,
          requestHandler: {
            httpOptions: {
              timeout: 30000,
            },
          },
        }
      }
    ];

    for (const { name, endpoint, config } of endpointConfigs) {
      try {
        const testClient = new S3Client(config);
        const command = new ListObjectsV2Command({
          Bucket: process.env.R2_BUCKET,
          MaxKeys: 1,
        });

        const result = await testClient.send(command);
        
        return NextResponse.json({
          success: true,
          message: `${name} - R2 connection successful`,
          endpoint: endpoint,
          bucket: process.env.R2_BUCKET,
          objectCount: result.KeyCount || 0,
          envCheck,
          sampleObjects: result.Contents?.slice(0, 5) || []
        });
      } catch (configError) {
        const errorMessage = configError instanceof Error ? configError.message : 'Unknown error';
        const errorCode = configError instanceof Error && 'code' in configError ? (configError as any).code : 'UNKNOWN';
        
        // Store the first error for reporting
        if (!firstError) {
          firstError = {
            name,
            endpoint,
            message: errorMessage,
            code: errorCode
          };
        }
        continue;
      }
    }

    // If all configurations failed, return detailed error information
    const errorDetails = firstError ? {
      failedEndpoint: firstError.name,
      endpoint: firstError.endpoint,
      errorMessage: firstError.message,
      errorCode: firstError.code
    } : {};
    
    throw new Error(`All R2 endpoint configurations failed. First error: ${firstError?.message || 'Unknown'}`);

  } catch (error) {
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      envCheck: {
        R2_ENDPOINT: !!process.env.R2_ENDPOINT,
        R2_ACCESS_KEY_ID: !!process.env.R2_ACCESS_KEY_ID,
        R2_SECRET_ACCESS_KEY: !!process.env.R2_SECRET_ACCESS_KEY,
        R2_BUCKET: !!process.env.R2_BUCKET,
        R2_PUBLIC_BASE: !!process.env.R2_PUBLIC_BASE,
      },
      endpointValue: process.env.R2_ENDPOINT
    }, { status: 500 });
  }
}
