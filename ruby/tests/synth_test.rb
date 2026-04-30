require 'minitest/autorun'

# Stub require for missing gems
module Kernel
  alias_method :original_require, :require
  def require(name)
    if %w[mb-sound unimidi numo/narray].include?(name)
      return true
    end
    original_require(name)
  end
end

class MockNumoArray
  attr_reader :data
  def initialize(count, val=0.0)
    @data = Array.new(count, val)
  end
  def *(other)
    if other.is_a?(MockNumoArray)
      res = MockNumoArray.new(@data.size)
      @data.size.times { |i| res.data[i] = @data[i] * other.data[i] }
      res
    else
      res = MockNumoArray.new(@data.size)
      @data.size.times { |i| res.data[i] = @data[i] * other }
      res
    end
  end
  def sum
    @data.sum
  end
end

module Numo
  class SFloat
    def self.zeros(count)
      MockNumoArray.new(count, 0.0)
    end
  end
end

module MB
  module Sound
    class Note
      def initialize(note)
        @note = note
      end
      def frequency
        440.0 * (2 ** ((@note - 69) / 12.0))
      end
    end

    class Oscillator
      def tone
        self
      end
      def sample(count)
        MockNumoArray.new(count, 0.5)
      end
    end

    def self.constant(freq)
      Oscillator.new
    end

    module Envelope
      class ADSR
        attr_reader :trigger_time
        def initialize(**args)
          @done = false
          @trigger_time = nil
        end
        def trigger(vel)
          @trigger_time = Time.now
          @done = false
        end
        def release
          @done = true
        end
        def sample(count)
          MockNumoArray.new(count, 1.0)
        end
        def done?
          @done
        end
      end
    end

    class JackFFI
      def self.[]
        self.new
      end
      def write(data)
        # do nothing
      end
    end
  end
end

module UniMIDI
  class Input
    def self.gets
      # mock input
    end
  end
end

# Load the target file
require_relative '../synth.rb'

class SynthTest < Minitest::Test
  def setup
    @synth = PolySynth.new(4) # 4 voices for testing
  end

  def test_voice_initialization
    voice = Voice.new(0)
    assert_equal 0, voice.id
    refute voice.active
    assert_nil voice.note
  end

  def test_voice_note_on_and_off
    voice = Voice.new(1)
    voice.note_on(60, 100) # Middle C, velocity 100
    
    assert voice.active
    assert_equal 60, voice.note
    
    voice.note_off
    
    voice.sample(10)
    refute voice.active, "Voice should be inactive after envelope release"
    assert_nil voice.note, "Note should be nil after release"
  end

  def test_polysynth_allocates_voices
    [60, 62, 64, 65].each do |note|
      @synth.note_on(note, 100)
    end
    
    active_voices = @synth.instance_variable_get(:@voices).select(&:active)
    assert_equal 4, active_voices.size
    
    sleep 0.01
    @synth.note_on(67, 100)
    
    active_voices = @synth.instance_variable_get(:@voices).select(&:active)
    assert_equal 4, active_voices.size
    
    notes_playing = active_voices.map(&:note)
    assert_includes notes_playing, 67
  end

  def test_polysynth_note_off
    @synth.note_on(60, 100)
    @synth.note_on(64, 100)
    
    @synth.note_off(60)
    
    @synth.instance_variable_get(:@voices).each { |v| v.sample(10) }
    
    active_voices = @synth.instance_variable_get(:@voices).select(&:active)
    assert_equal 1, active_voices.size
    assert_equal 64, active_voices.first.note
  end
end
