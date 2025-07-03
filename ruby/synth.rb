# poly_synth.rb
#
# A polyphonic synthesizer in Ruby.
#
# Dependencies:
#   - mb-sound
#   - unimidi
#
# Installation:
#   gem install mb-sound unimidi
#
# Usage:
#   ruby poly_synth.rb
#

require 'mb-sound'
require 'unimidi'

# The number of simultaneous voices (notes) the synthesizer can play.
NUM_VOICES = 8

# -- Classes -----------------------------------------------------------------

# Represents a single voice of the synthesizer. Each voice has its own
# oscillator and envelope.
class Voice
  attr_reader :id, :active, :note

  def initialize(id)
    @id = id
    @active = false
    @note = nil
    @oscillator = nil
    @envelope = nil

    # ADSR (Attack, Decay, Sustain, Release) envelope parameters
    @attack_time = 0.01
    @decay_time = 0.1
    @sustain_level = 0.7
    @release_time = 0.5
  end

  # Starts playing a note with a given frequency.
  def note_on(note, velocity)
    @note = note
    @active = true
    frequency = MB::Sound::Note.new(note).frequency

    # Create a new oscillator for the given frequency
    @oscillator = MB::Sound.constant(frequency).tone

    # Create an ADSR envelope
    @envelope = MB::Sound::Envelope::ADSR.new(
      attack: @attack_time,
      decay: @decay_time,
      sustain: @sustain_level,
      release: @release_time,
      rate: 48000 # Sample rate
    )

    # Trigger the attack phase of the envelope
    @envelope.trigger(velocity / 127.0)
  end

  # Starts the release phase of the envelope for the current note.
  def note_off
    @envelope.release
  end

  # Generates the next audio sample for this voice.
  def sample(count)
    return Numo::SFloat.zeros(count) unless @active && @oscillator && @envelope

    # When the envelope is done, the voice is no longer active
    if @envelope.done?
      @active = false
      @note = nil
      return Numo::SFloat.zeros(count)
    end

    @oscillator.sample(count) * @envelope.sample(count)
  end
end

# The main synthesizer class. Manages all the voices and mixes their output.
class PolySynth
  def initialize(num_voices)
    @voices = num_voices.times.map { |i| Voice.new(i) }
    @output = MB::Sound::JackFFI[] # Use JACK for audio output
  end

  # Starts the synthesizer's main loop.
  def run
    @output.write(@voices.map { |v| v.sample(1024) }.sum) until false
  end

  # Plays a note. Finds an available voice and triggers it.
  def note_on(note, velocity)
    voice = find_available_voice
    voice&.note_on(note, velocity)
  end

  # Releases a note. Finds the voice playing the note and releases it.
  def note_off(note)
    voice = @voices.find { |v| v.active && v.note == note }
    voice&.note_off
  end

  private

  # Finds the first inactive voice. If all voices are active, it returns the
  # one that was triggered the longest time ago.
  def find_available_voice
    @voices.find { |v| !v.active } || @voices.min_by { |v| v.envelope&.trigger_time || Time.now }
  end
end

# -- Main Application --------------------------------------------------------

puts "Starting Polyphonic Synthesizer..."
puts "Connect a MIDI device to play."
puts "Press Ctrl+C to exit."

# Create and run the synthesizer in a separate thread
synth = PolySynth.new(NUM_VOICES)
synth_thread = Thread.new { synth.run }

# Set up MIDI input
input = UniMIDI::Input.gets

# Main loop to listen for MIDI messages
loop do
  m = input.gets
  next unless m

  # MIDI messages are arrays of hashes
  m.each do |msg|
    data = msg[:data]
    case data[0]
    when 0x90 # Note On
      note, velocity = data[1], data[2]
      if velocity > 0
        synth.note_on(note, velocity)
      else
        # Note On with velocity 0 is equivalent to Note Off
        synth.note_off(note)
      end
    when 0x80 # Note Off
      note = data[1]
      synth.note_off(note)
    end
  end
end

# Cleanly exit on Ctrl+C
trap("INT") do
  puts "\nStopping synthesizer..."
  synth_thread.kill
  exit
end
