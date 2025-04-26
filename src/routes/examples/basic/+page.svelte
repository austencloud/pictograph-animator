<script lang="ts">
  import { PictographAnimator } from '$lib/components';
  import { simpleShapeAnimation } from '$lib/examples/samplePictographs';
</script>

<div class="container mx-auto p-4">
  <h1 class="text-3xl font-bold mb-6">Basic Pictograph Animation</h1>
  
  <p class="mb-4">
    This is a simple example of the PictographAnimator component with default settings.
  </p>
  
  <div class="w-64 h-64 border rounded bg-white flex items-center justify-center">
    <PictographAnimator 
      pictograph={simpleShapeAnimation} 
      config={{ autoplay: true, loop: true }}
    />
  </div>
  
  <div class="mt-8">
    <h2 class="text-xl font-semibold mb-2">Usage</h2>
    <pre class="bg-gray-100 p-4 rounded overflow-x-auto">
{`<script>
  import { PictographAnimator } from 'pictograph-animator';
  import { simpleShapeAnimation } from 'pictograph-animator/examples';
</script>

<PictographAnimator 
  pictograph={simpleShapeAnimation} 
  config={{ autoplay: true, loop: true }}
/>`}
    </pre>
  </div>
</div>
