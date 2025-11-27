<template>
  <tr>
    <td>{{ item.productName }}</td>
    <td>{{ item.unitPrice.toLocaleString() }}₫</td>
    <td>
      <input type="number" v-model.number="localQty" min="1"
             class="form-control form-control-sm w-75 d-inline"
             @change="onUpdateQty" />
    </td>
    <td>{{ (item.unitPrice * item.quantity).toLocaleString() }}₫</td>
    <td>
      <button class="btn btn-outline-danger btn-sm" @click="$emit('remove', item.productId)">
        <i class="bi bi-trash"></i>
      </button>
    </td>
  </tr>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({ item: Object });
const emits = defineEmits(['update', 'remove']);
const localQty = ref(props.item.quantity);

function onUpdateQty() {
  if (localQty.value !== props.item.quantity) {
    emits('update', { productId: props.item.productId, quantity: localQty.value });
  }
}
</script>
