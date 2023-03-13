#include <stdint.h>
#include <string.h>
#include <iostream>
#include <fstream>
#include <stdio.h>
#include <chrono>
#include <string>
#include <sstream>
#include <iomanip>

/************************ Macros *****************************/

#define G(r, i, a, b, c, d)                                        \
    {                                                              \
        a += b + m[blake2s_sigma[r][2 * i + 0]];                   \
        d = rotr32_device(d ^ a, 16); /* d = ROTR32(d ^ a, 16); */ \
        c = c + d;                                                 \
        b = rotr32_device(b ^ c, 12);                              \
        a += b + m[blake2s_sigma[r][2 * i + 1]];                   \
        d = rotr32_device(d ^ a, 8); /* ROTR32(d ^ a, 8); */       \
        c = c + d;                                                 \
        b = rotr32_device(b ^ c, 7);                               \
    }
#define ROUND(r)                           \
    {                                      \
        G(r, 0, v[0], v[4], v[8], v[12]);  \
        G(r, 1, v[1], v[5], v[9], v[13]);  \
        G(r, 2, v[2], v[6], v[10], v[14]); \
        G(r, 3, v[3], v[7], v[11], v[15]); \
        G(r, 4, v[0], v[5], v[10], v[15]); \
        G(r, 5, v[1], v[6], v[11], v[12]); \
        G(r, 6, v[2], v[7], v[8], v[13]);  \
        G(r, 7, v[3], v[4], v[9], v[14]);  \
    }

/************************ Constants *****************************/

__device__ static const uint32_t blake2s_IV[8] =
    {
        0x6A09E667UL, 0xBB67AE85UL, 0x3C6EF372UL, 0xA54FF53AUL,
        0x510E527FUL, 0x9B05688CUL, 0x1F83D9ABUL, 0x5BE0CD19UL};

__device__ static const uint8_t blake2s_sigma[10][16] =
    {
        {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15},
        {14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3},
        {11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4},
        {7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8},
        {9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13},
        {2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9},
        {12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11},
        {13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10},
        {6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5},
        {10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0}};


__device__ static const uint8_t BLAKE2S_BLOCKBYTES = 64;

/************************ Types *****************************/
typedef unsigned char BYTE; // 8-bit byte
typedef uint32_t WORD;      // 32-bit word, change to "long" for 16-bit machines
typedef struct blake2s_state__
  {
    uint32_t h[8];
    uint32_t t[2];
    uint32_t f[1];
    uint8_t  buf[BLAKE2S_BLOCKBYTES];
    size_t   buflen;
    size_t   outlen;
  } blake2s_state;

/************************ Store and Load *****************************/

__device__ static inline uint32_t load32_device(const void *src)
{
    return *(uint32_t *)(src);
}

/*********************** FUNCTION DECLARATIONS **********************/
__device__ void blake2s_init_device(blake2s_state *S);
__device__ int blake2s_update_device(blake2s_state *S, const BYTE in[], int inlen);
__device__ int blake2s_final_device(blake2s_state *S, void *out);



/************************ Function *****************************/

__device__ void blake2s_init_device(blake2s_state *S)
{

    S->h[0] = blake2s_IV[0] ^ 0x01010000 ^ 0 ^ 32;
    S->h[1] = blake2s_IV[1];
    S->h[2] = blake2s_IV[2];
    S->h[3] = blake2s_IV[3];
    S->h[4] = blake2s_IV[4];
    S->h[5] = blake2s_IV[5];
    S->h[6] = blake2s_IV[6];
    S->h[7] = blake2s_IV[7];

    S->t[0] = 0;
    S->t[1] = 0;
    S->f[0] = 0;
    S->buflen = 0;
    S->outlen = 32;
}

__device__ static void blake2s_increment_counter_device(blake2s_state *S, const uint32_t inc)
{
    S->t[0] += inc;
    S->t[1] += (S->t[0] < inc);
}

__device__ static inline uint32_t rotr32_device(const uint32_t w, const unsigned c)
{
    return (w >> c) | (w << (32 - c));
}

__device__ static void blake2s_compress_device(blake2s_state *S, const uint8_t in[BLAKE2S_BLOCKBYTES], bool last)
{
    uint32_t m[16];
    uint32_t v[16];
    size_t i;

#pragma unroll
    for (i = 0; i < 16; ++i)
    {
        m[i] = load32_device(in + i * sizeof(m[i]));
    }

    v[0] = S->h[0];
    v[1] = S->h[1];
    v[2] = S->h[2];
    v[3] = S->h[3];
    v[4] = S->h[4];
    v[5] = S->h[5];
    v[6] = S->h[6];
    v[7] = S->h[7];

    v[8] = blake2s_IV[0];
    v[9] = blake2s_IV[1];
    v[10] = blake2s_IV[2];
    v[11] = blake2s_IV[3];
    v[12] = S->t[0] ^ blake2s_IV[4];
    v[13] = S->t[1] ^ blake2s_IV[5];
    v[14] = S->f[0] ^ blake2s_IV[6];
    if (last)
    {
        v[14] = ~v[14];
    }

    v[15] = blake2s_IV[7];

    ROUND(0);
    ROUND(1);
    ROUND(2);
    ROUND(3);
    ROUND(4);
    ROUND(5);
    ROUND(6);
    ROUND(7);
    ROUND(8);
    ROUND(9);

#pragma unroll
    for (i = 0; i < 8; ++i)
    {
        S->h[i] = S->h[i] ^ v[i] ^ v[i + 8];
    }
}

__device__ int blake2s_update_device(blake2s_state *S, const BYTE in[], int inlen)
{
    int i;

#pragma unroll
    for (i = 0; i < inlen; ++i)
    {
        S->buf[S->buflen] = in[i];
        S->buflen++;
        if (S->buflen == 64)
        {
            blake2s_increment_counter_device(S, BLAKE2S_BLOCKBYTES);
            blake2s_compress_device(S, S->buf, false);
            S->buflen = 0;
        }
    }

    // size_t fill = BLAKE2S_BLOCKBYTES;
    // if (inlen > fill)
    // {
    //     memcpy(S->buf, in, fill); /* Fill buffer */
    //     blake2s_increment_counter_device(S, BLAKE2S_BLOCKBYTES);
    //     blake2s_compress_device(S, S->buf, false); /* Compress */
    //     in += fill;
    //     inlen -= fill;
    //     while (inlen > BLAKE2S_BLOCKBYTES)
    //     {
    //         blake2s_increment_counter_device(S, BLAKE2S_BLOCKBYTES);
    //         blake2s_compress_device(S, in, false);
    //         in += BLAKE2S_BLOCKBYTES;
    //         inlen -= BLAKE2S_BLOCKBYTES;
    //     }
    // }
    // memcpy(S->buf + S->buflen, in, inlen);
    // S->buflen += inlen;

    return 0;
}

__device__ int blake2s_final_device(blake2s_state *S, void *out)
{

    blake2s_increment_counter_device(S, (uint32_t)S->buflen);
    memset(S->buf + S->buflen, 0, BLAKE2S_BLOCKBYTES - S->buflen); /* Padding */
    blake2s_compress_device(S, S->buf, true);

    memcpy(out, S->h, S->outlen);
    return 0;
}