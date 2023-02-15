#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <cuda.h>
#include <sys/time.h>
#include <pthread.h>
#include <locale.h>
#include "b2s.cuh"

/************************ MACROS *****************************/
// CUDA
#define THREADS 1024
#define BLOCKS 256
#define GPUS 3
// Mining
#define DIFFICULTY 4
#define RANDOM_LEN 64
// Files
#define MAX_FILE_LEN 1000

/************************ TYPES *****************************/

struct HandlerInput
{
    int device;
    unsigned long hashesProcessed;
    int prefix_len;
    int suffix_len;
};
typedef struct HandlerInput HandlerInput;

/************************ CONSTANTS *****************************/

__constant__ BYTE characterSet[17] = {"0123456789abcdef"};

/************************ DEVICE - HELPER *****************************/

__global__ void initSolutionMemory(char *blockContainsSolution)
{
    *blockContainsSolution = -1;
}

__device__ unsigned long deviceRandomGen(unsigned long x)
{
    x ^= (x << 21);
    x ^= (x >> 35);
    x ^= (x << 4);
    return x;
}

__device__ void digest_to_hex(char *hash, unsigned char digest[32])
{
    int hash_index = 0;

    for (int i = 0; i < 32; i++)
    {
        hash[hash_index++] = characterSet[(digest[i] & 0xF0) >> 4];
        hash[hash_index++] = characterSet[digest[i] & 0x0F];
    }

    hash[hash_index] = '\0';

    return;
}

/************************ DEVICE - MAIN *****************************/

__global__ void blake2s_cuda_mining(BYTE *prefix, int *prefix_len,
                                    BYTE *suffix, int *suffix_len,
                                    BYTE *nonce, char *hash,
                                    char *blockContainsSolution,
                                    unsigned long baseSeed)
{
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    blake2s_state ctx;
    BYTE digest[32];
    BYTE random[RANDOM_LEN];
    unsigned long seed = baseSeed;
    seed += (unsigned long)i;
    for (int j = 0; j < 64; j++)
    {
        seed = deviceRandomGen(seed);
        int randomIdx = (int)(seed % 16);
        random[j] = characterSet[randomIdx];
    }

    // Initilize
    blake2s_init_device(&ctx);
    // Add in different parts of the input
    blake2s_update_device(&ctx, prefix, *prefix_len);
    blake2s_update_device(&ctx, random, RANDOM_LEN);
    blake2s_update_device(&ctx, suffix, *suffix_len);
    // Produce final hash
    blake2s_final_device(&ctx, digest);

    for (int j = 0; j < DIFFICULTY; j++)
        if (digest[j] > 0)
            return;
    if (digest[DIFFICULTY] > 0xAA)
    {
        return;
    }

    if (*blockContainsSolution == 1)
        return;
    *blockContainsSolution = 1;
    for (int j = 0; j < RANDOM_LEN; j++)
        nonce[j] = random[j];

    digest_to_hex(hash, digest);
}

/************************ HOST - HELPER *****************************/

void hostRandomGen(unsigned long *x)
{
    *x ^= (*x << 21);
    *x ^= (*x >> 35);
    *x ^= (*x << 4);
}

long long timems()
{
    struct timeval end;
    gettimeofday(&end, NULL);
    return end.tv_sec * 1000LL + end.tv_usec / 1000;
}

int read_file_into_array(const char *filename, unsigned char *array)
{
    FILE *fp;
    int length;

    fp = fopen(filename, "rb");
    if (fp == NULL)
    {
        printf("Error opening %s\n", filename);
        return -1;
    }

    length = fread(array, 1, MAX_FILE_LEN, fp);
    fclose(fp);

    return length;
}

/************************ HOST - VAR *****************************/

pthread_mutex_t solutionLock;
BYTE *nonce;
char *hash;

BYTE cpuPrefix[MAX_FILE_LEN];
BYTE cpuSuffix[MAX_FILE_LEN];

/************************ HOST - MAIN *****************************/

void *launchGPUHandlerThread(void *vargp)
{
    HandlerInput *hi = (HandlerInput *)vargp;
    cudaSetDevice(hi->device);

    // HOST MEMORY ALLOCATION

    // Store nonce and solution;
    BYTE *nonceSolution = (BYTE *)malloc(sizeof(BYTE) * RANDOM_LEN);
    char *hashSolution = (char *)malloc(sizeof(char) * 65);
    char *blockContainsSolution = (char *)malloc(sizeof(char));
    unsigned long rngSeed = timems();

    // DEVICE MEMORY ALLOCATION

    // Store prefix
    BYTE *d_prefix;
    cudaMalloc(&d_prefix, hi->prefix_len);
    cudaMemcpy(d_prefix, cpuPrefix, hi->prefix_len, cudaMemcpyHostToDevice);

    // Store suffix
    BYTE *d_suffix;
    cudaMalloc(&d_suffix, hi->suffix_len);
    cudaMemcpy(d_suffix, cpuSuffix, hi->suffix_len, cudaMemcpyHostToDevice);

    // Store lengths
    int *d_prefix_len;
    cudaMalloc(&d_prefix_len, sizeof(int));
    cudaMemcpy(d_prefix_len, &(hi->prefix_len), sizeof(int), cudaMemcpyHostToDevice);

    int *d_suffix_len;
    cudaMalloc(&d_suffix_len, sizeof(int));
    cudaMemcpy(d_suffix_len, &(hi->suffix_len), sizeof(int), cudaMemcpyHostToDevice);

    BYTE *d_nonce;
    cudaMalloc(&d_nonce, sizeof(BYTE) * RANDOM_LEN);

    char *d_hash;
    cudaMalloc(&d_hash, sizeof(char) * 65);

    char *d_blockContainsSolution;
    cudaMalloc(&d_blockContainsSolution, sizeof(char));

    initSolutionMemory<<<1, 1>>>(d_blockContainsSolution);

    while (1)
    {
        hostRandomGen(&rngSeed);

        hi->hashesProcessed += THREADS * BLOCKS;
        blake2s_cuda_mining<<<THREADS, BLOCKS>>>(d_prefix, d_prefix_len,
                                                 d_suffix, d_suffix_len,
                                                 d_nonce, d_hash,
                                                 d_blockContainsSolution,
                                                 rngSeed);
        cudaDeviceSynchronize();

        cudaMemcpy(blockContainsSolution, d_blockContainsSolution, sizeof(char), cudaMemcpyDeviceToHost);
        if (*blockContainsSolution == 1)
        {
            // Copy Nonce
            cudaMemcpy(nonceSolution, d_nonce, sizeof(BYTE) * RANDOM_LEN, cudaMemcpyDeviceToHost);
            nonce = nonceSolution;
            // Copy Hash of the block
            cudaMemcpy(hashSolution, d_hash, sizeof(char) * 65, cudaMemcpyDeviceToHost);
            hash = hashSolution;

            pthread_mutex_unlock(&solutionLock);
            break;
        }

        if (nonce)
        {
            break;
        }
    }

    cudaDeviceReset();
    return NULL;
}

int main()
{
    setlocale(LC_NUMERIC, "");
    pthread_mutex_init(&solutionLock, NULL);
    pthread_mutex_lock(&solutionLock);

    // Read in files.
    int prefix_len = read_file_into_array("prefix.txt", cpuPrefix);
    int suffix_len = read_file_into_array("suffix.txt", cpuSuffix);

    unsigned long **processedPtrs = (unsigned long **)malloc(sizeof(unsigned long *) * GPUS);
    pthread_t *tids = (pthread_t *)malloc(sizeof(pthread_t) * GPUS);
    long long start = timems();

    for (int i = 0; i < GPUS; i++)
    {
        HandlerInput *hi = (HandlerInput *)malloc(sizeof(HandlerInput));
        hi->device = i;
        hi->hashesProcessed = 0;
        hi->prefix_len = prefix_len;
        hi->suffix_len = suffix_len;
        processedPtrs[i] = &hi->hashesProcessed;
        pthread_create(tids + i, NULL, launchGPUHandlerThread, hi);
        usleep(10);
    }

    while (1)
    {
        // unsigned long totalProcessed = 0;
        // for (int i = 0; i < GPUS; i++)
        // {
        //     totalProcessed += *(processedPtrs[i]);
        // }
        // long long elapsed = timems() - start;

        // // printf("Hashes (%'lu) Seconds (%'f) Hashes/sec (%'lu)\r", totalProcessed, ((float)elapsed) / 1000.0, (unsigned long)((double)totalProcessed / (double)elapsed) * 1000);
        if (nonce)
        {
            break;
        }
    }
    //  printf("\n");

    pthread_mutex_lock(&solutionLock);
    //     long long end = timems();
    // long long elapsed = end - start;

    // Solution Found

    for (int i = 0; i < GPUS; i++)
    {
        pthread_join(tids[i], NULL);
    }

    // unsigned long totalProcessed = 0;
    // for (int i = 0; i < GPUS; i++)
    // {
    //     totalProcessed += *(processedPtrs[i]);
    // }

    // Change RANDOM_LEN here as well.
    printf("%.64s\n", nonce);
    printf("%.64s\n", hash);
    // printf("Difficulty: %i\n", DIFFICULTY);
    // printf("Hashes processed: %'lu\n", totalProcessed);
    // printf("Time: %llu ms\n", elapsed);
    // printf("Hashes/sec: %'lu\n", (unsigned long)((double)totalProcessed / (double)elapsed) * 1000);

    return 0;
}
