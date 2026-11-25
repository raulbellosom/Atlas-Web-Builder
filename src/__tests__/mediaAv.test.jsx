import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { baseBlocks, VideoBlock, AudioBlock, ImageBlock } from '../blocks/index.js'
import { AtlasWebBuilderProvider } from '../provider/AtlasWebBuilderProvider.jsx'
import { AtlasWebRenderer } from '../renderer/AtlasWebRenderer.jsx'
import { assetKind, assetProps, mediaFieldKey } from '../editor/assets/assetSource.js'
import { defaultFields } from '../editor/fields/index.js'

const page = (type, props) => ({ schemaVersion: 1, id: 'p', slug: '/', title: 't', visibility: 'public', layoutId: null, regions: { main: { id: 'r', children: ['b'] } }, blocks: { b: { id: 'b', type, props, children: {} } }, seo: {}, updatedAt: '' })
const show = (type, props) => render(<AtlasWebBuilderProvider blocks={baseBlocks}><AtlasWebRenderer page={page(type, props)} mode="public" /></AtlasWebBuilderProvider>).container

describe('audio and video media', () => {
  it('a library file wins over a URL and plays natively, never as an embed', () => {
    const c = show('VideoBlock', { file: 'https://cdn.example/clip.mp4', src: 'https://youtu.be/abc', caption: 'Demo' })
    const video = c.querySelector('video')
    expect(video?.getAttribute('src')).toBe('https://cdn.example/clip.mp4')
    expect(video?.getAttribute('preload')).toBe('metadata')
    expect(c.querySelector('iframe')).toBeNull()
  })

  it('without a file VideoBlock keeps its URL behavior', () => {
    expect(show('VideoBlock', { src: 'https://youtu.be/abc' }).querySelector('iframe')).toBeTruthy()
  })

  it('AudioBlock renders accessible native controls, or a placeholder when empty', () => {
    const audio = show('AudioBlock', { file: '/media/tema.mp3', title: 'Tema' }).querySelector('audio')
    expect(audio?.hasAttribute('controls')).toBe(true)
    expect(audio?.getAttribute('aria-label')).toBe('Tema')
    expect(show('AudioBlock', {}).querySelector('audio')).toBeNull()
  })

  it('media URLs with an executable or local scheme never reach an <audio> or <video> element', () => {
    for (const bad of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'vbscript:x', 'data:audio/mpeg;base64,AAAA', 'data:text/html,<script>1</script>', 'file:///etc/passwd', 'ftp://host/a.mp3', 'about:blank', ' javascript:alert(1)']) {
      expect(show('AudioBlock', { file: bad }).querySelector('audio')).toBeNull()
      expect(show('VideoBlock', { file: bad }).querySelector('video')).toBeNull()
      expect(show('VideoBlock', { file: 'https://cdn.example/v.mp4', poster: bad }).querySelector('video')?.getAttribute('poster') ?? null).toBeNull()
    }
  })

  it('https, site-relative paths and blob: previews play; blob: is the editor-session form of a library file', () => {
    for (const ok of ['https://cdn.example/a.mp3', '/media/a.mp3', 'blob:https://erp.example/6f1c']) {
      expect(show('AudioBlock', { file: ok }).querySelector('audio')?.getAttribute('src')).toBe(ok)
    }
  })

  it('assets go only to a field of their own kind', () => {
    expect(assetKind({ mime: 'video/mp4' })).toBe('video')
    expect(assetKind({ kind: 'audio', mime: 'video/mp4' })).toBe('audio')
    expect(assetKind({ mime: 'image/png' })).toBe('image')
    expect(mediaFieldKey(VideoBlock, 'video')).toBe('file')
    expect(mediaFieldKey(VideoBlock, 'image')).toBe('poster')
    expect(mediaFieldKey(AudioBlock, 'video')).toBeNull()
    expect(assetProps(VideoBlock, { url: '/v.mp4', mime: 'video/mp4' })).toEqual({ file: '/v.mp4' })
    expect(assetProps(AudioBlock, { url: '/a.mp3', kind: 'audio' })).toEqual({ file: '/a.mp3' })
    expect(assetProps(ImageBlock, { url: '/a.mp3', kind: 'audio' })).toBeNull()
  })

  it('video and audio field types are registered', () => {
    expect(defaultFields.video).toBeTruthy()
    expect(defaultFields.audio).toBe(defaultFields.video)
  })
})
